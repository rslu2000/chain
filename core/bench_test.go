package core

import (
	"context"
	"encoding/csv"
	"os"
	"sync"
	"testing"
	"time"

	"chain/core/account"
	"chain/core/asset"
	"chain/core/coretest"
	"chain/core/generator"
	"chain/core/txbuilder"
	"chain/database/pg/pgtest"
	"chain/protocol/bc"
	"chain/protocol/prottest"
	"chain/testutil"
)

// Resurrected and adapted from
// https://github.com/chain/chainprv/blob/9d4d585875a48d7415ebeda2c093d192cb9bd0bb/core/asset/assettest/populate.go
func BenchTransactionFile(b *testing.B) {
	filename, ok := os.LookupEnv("TESTFILE")
	if !ok {
		b.Fatal("no filename in environment var TESTFILE")
	}
	f, err := os.Open(filename)
	if err != nil {
		b.Fatal(err)
	}
	defer f.Close()

	_, db := pgtest.NewDB(b, pgtest.SchemaPath)
	ctx := context.Background()
	c := prottest.NewChain(b)
	assets := asset.NewRegistry(db, c)
	accounts := account.NewManager(db, c)

	type accountAssetPair struct {
		accountID string
		assetID   bc.AssetID
	}
	type trade struct {
		dollars, shares             uint64
		shareAssetID                bc.AssetID
		shareSellerID, shareBuyerID string
	}
	type balanceMap map[accountAssetPair]int64

	// We call them dollars but it could be anything.
	usdAsset, err := assets.Define(ctx, xpubs, 1, nil, "", nil, nil)
	if err != nil {
		b.Fatal(err)
	}

	// Maps input "buyer" and "seller" ids to Chain accountIDs.
	accountMap := make(map[string]string)

	// Maps input "stockIDs" to Chain assetIDs.
	assetMap := make(map[string]bc.AssetID)

	// Records the lowest balance seen for each account/asset pair
	// during a prescan of the trades in the input.
	lowWaterMarks := make(map[accountAssetPair]int64)

	balances := make(balanceMap)

	var trades []*trade

	csvReader := csv.NewReader(r)
	for {
		rawitem, err := csvReader.Read()
		if err != nil {
			b.Fatal(err)
		}
		rawPrice := mustParseInt(rawitem[0])
		rawShares := mustParseInt(rawitem[1])
		rawBuyer := rawitem[2]
		rawSeller := rawitem[3]
		rawStockID := rawitem[4]
		if rawBuyer == rawSeller {
			continue
		}
		var (
			assetID bc.AssetID
			ok      bool
		)
		if assetID, ok = assetMap[rawStockID]; !ok {
			asset, err := assets.Define(ctx, xpubs, 1, nil, "", nil, nil)
			if err != nil {
				b.Fatal(err)
			}
			assetMap[rawStockID] = asset.AssetID
		}
		var sellerAccountID string
		if sellerAccountID, ok = accountMap[rawSeller]; !ok {
			sellerAccount, err := accounts.Create(ctx, xpubs, 1, "", nil, nil)
			if err != nil {
				b.Fatal(err)
			}
			accountMap[rawSeller] = sellerAccount.ID
		}
		sellerAssetPair := accountAssetPair{sellerAccountID, assetID}
		balances[accountAssetPair{sellerAccountID, usdAssetID}] += rawPrice
		balances[sellerAssetPair] -= rawShares
		if balances[sellerAssetPair] < lowWaterMarks[sellerAssetPair] {
			lowWaterMarks[sellerAssetPair] = balances[sellerAssetPair]
		}

		var buyerAccountID string
		if buyerAccountID, ok = accountMap[rawBuyer]; !ok {
			buyerAccount, err := accounts.Create(ctx, xpubs, 1, "", nil, nil)
			if err != nil {
				b.Fatal(err)
			}
			accountMap[rawBuyer] = buyerAccount.ID
		}
		buyerUSDassetPair := accountAssetPair{buyerAccountID, usdAssetID}
		balances[buyerUSDassetPair] -= rawPrice
		balances[accountAssetPair{buyerAccountID, assetID}] += rawShares
		if balances[buyerUSDassetPair] < lowWaterMarks[buyerUSDassetPair] {
			lowWaterMarks[buyerUSDassetPair] = balances[buyerUSDassetPair]
		}

		trades = append(trades, &trade{
			dollars:       uint64(rawPrice),
			shares:        uint64(rawShares),
			shareAssetID:  assetID,
			shareSellerID: sellerAccountID,
			shareBuyerID:  buyerAccountID,
		})
	}

	ctx, cancel = context.WithCancel(ctx)
	defer cancel()

	generator.Generate(ctx, c, signers, db, time.Second, func(err error) {})

	b.ResetTimer()

	m := new(sync.Mutex)
	cv := sync.NewCond(m)
	var running int // protected by m; decrements signaled by cv

	for accountAsset, amount := range lowWaterMarks {
		m.Lock()
		for running >= maxRunning {
			cv.Wait()
		}
		m.Unlock()

		accountAsset := accountAsset
		amount := amount

		go func() {
			m.Lock()
			running++
			m.Unlock()

			defer func() {
				m.Lock()
				running--
				cv.Signal()
				defer m.Unlock()
			}()

			assetAmt := bc.AssetAmount{accountAsset.assetID, amount}
			actions := []txbuilder.Action{
				assets.NewIssueAction(assetAmt, nil),
				accounts.NewControlAction(assetAmt, accountAsset.accountID, nil),
			}
			tmpl, err := txbuilder.Build(ctx, nil, actions, time.Now().Add(time.Minute))
			if err != nil {
				b.Fatal(err)
			}
			coretest.SignTxTemplate(t, ctx, tmpl, &testutil.TestXPrv)
			// xxx submit
		}()
	}

	for _, tr := range trades {
		m.Lock()
		for running >= maxRunning {
			cv.Wait()
		}
		m.Unlock()

		go func() {
			m.Lock()
			running++
			m.Unlock()

			defer func() {
				m.Lock()
				running--
				cv.Signal()
				defer m.Unlock()
			}()

			usdAssetAmt := bc.AssetAmount{usdAsset.AssetID, tr.dollars}
			shareAssetAmt := bc.AssetAmount{tr.shareAssetID, tr.shares}
			actions := []txbuilder.Action{
				accounts.NewSpendAction(usdAssetAmt, tr.shareBuyerID, nil, nil, nil, nil),
				accounts.NewSpendAction(shareAssetAmt, tr.shareSellerID, nil, nil, nil, nil),
				accounts.NewControlAction(usdAssetAmt, tr.shareSellerID, nil),
				accounts.NewControlAction(shareAssetAmt, tr.shareBuyerID, nil),
			}
			tmpl, err := txbuilder.Build(ctx, nil, actions, time.Now().Add(time.Minute))
			if err != nil {
				b.Fatal(err)
			}
			coretest.SignTxTemplate(t, ctx, tmpl, &testutil.TestXPrv)
			// xxx submit
		}()
	}
}
