import java.net.URL;
import java.util.UUID;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Random;

import com.chain.api.*;
import com.chain.api.MockHsm.Key;
import com.chain.http.Context;
import com.chain.signing.HsmSigner;

public class Testnet {
  static Context ctx;
  static MockHsm.Key key;
  static String alice = "alice";
  static String bob = "bob";
  static String gold = "gold";
  // Used to distinguish issuances from differing
  // dynos on HK.
  static String token = UUID.randomUUID().toString();
  static Timer timer = new Timer();

  public static void main(String args[]) throws Exception {
    setup();
    new Issue().run();
  }

  private static void setup() throws Exception {
    ctx = new Context(new URL(String.format("http://127.0.0.1:%s", System.getenv("PORT"))));
    key = MockHsm.Key.create(ctx);
    HsmSigner.addKey(key, MockHsm.getSignerContext(ctx));
    new Account.Builder().addRootXpub(key.xpub).setAlias(alice).setQuorum(1).create(ctx);
    new Account.Builder().addRootXpub(key.xpub).setAlias(bob).setQuorum(1).create(ctx);
    new Asset.Builder()
        .addRootXpub(key.xpub)
        .setAlias(gold)
        .setQuorum(1)
        .addDefinitionField("core", "ccte")
        .addDefinitionField("token", token)
        .create(ctx);
  }

  static class Issue extends TimerTask {
    @Override
    public void run() {
      int delay = (5 + new Random().nextInt(5)) * 10000;
      timer.schedule(new Issue(), delay);
      try {

    Transaction.Template issuance =
        new Transaction.Builder()
            .addAction(new Transaction.Action.Issue().setAssetAlias(gold).setAmount(100))
            .addAction(
                new Transaction.Action.ControlWithAccount()
                    .setAccountAlias(alice)
                    .setAssetAlias(gold)
                    .setAmount(100))
			.addAction(
				new Transaction.Action.SetTransactionReferenceData()
					.addReferenceDataField("core", "ccte")
					.addReferenceDataField("token", token))
            .build(ctx);
    Transaction.submit(ctx, HsmSigner.sign(issuance));

    Transaction.Template spending =
        new Transaction.Builder()
            .addAction(
                new Transaction.Action.SpendFromAccount()
                    .setAccountAlias(alice)
                    .setAssetAlias(gold)
                    .setAmount(10))
            .addAction(
                new Transaction.Action.ControlWithAccount()
                    .setAccountAlias(bob)
                    .setAssetAlias(gold)
                    .setAmount(10))
			.addAction(
				new Transaction.Action.SetTransactionReferenceData()
					.addReferenceDataField("core", "ccte")
					.addReferenceDataField("token", token))
            .build(ctx);
    Transaction.submit(ctx, HsmSigner.sign(spending));

    Transaction.Template retirement =
        new Transaction.Builder()
            .addAction(
                new Transaction.Action.SpendFromAccount()
                    .setAccountAlias(bob)
                    .setAssetAlias(gold)
                    .setAmount(5))
            .addAction(new Transaction.Action.Retire().setAssetAlias(gold).setAmount(5))
			.addAction(
				new Transaction.Action.SetTransactionReferenceData()
					.addReferenceDataField("core", "ccte")
					.addReferenceDataField("token", token))
            .build(ctx);
    Transaction.submit(ctx, HsmSigner.sign(retirement));
      } catch (Exception e) {
        System.out.println(e);
      }
    }
  }
}
