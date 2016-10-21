import java.util.*;

import com.chain.api.*;
import com.chain.http.*;
import com.chain.signing.*;

class Queries {
  public static void main(String[] args) throws Exception {
    Client client = new Client();

    // snippet list-alice-transactions
    Transaction.Items aliceTransaction = new Transaction.QueryBuilder()
      .setFilter("inputs(account_alias=$1) AND outputs(account_alias=$1)")
      .addFilterParameter("alice")
      .execute(client);
    // endsnippet

    // snippet list-local-transactions
    Transaction.Items localTransactions = new Transaction.QueryBuilder()
      .setFilter("is_local=$1")
      .addFilterParameter("yes")
      .execute(client);
    // endsnippet

    // snippet list-local-assets
    Asset.Items localAssets = new Asset.QueryBuilder()
      .setFilter("is_local=$1")
      .addFilterParameter("yes")
      .execute(client);
    // endsnippet

    // snippet list-usd-assets
    Asset.Items localAssets = new Asset.QueryBuilder()
      .setFilter("definition.currency=$1")
      .addFilterParameter("USD")
      .execute(client);
    // endsnippet

    // snippet list-checking-accounts
    Account.Items checkingAccounts = new Account.QueryBuilder()
      .setFilter("tags.type=$1")
      .addFilterParameter("checking")
      .execute(client);
    // endsnippet

    // snippet list-alice-unspents
    UnspentOutput.Items aliceUnspentOuputs = new UnspentOutput.QueryBuilder()
      .setFilter("account_alias=$1")
      .addFilterParameter("alice")
      .execute(client);
    // endsnippet
  }
}
