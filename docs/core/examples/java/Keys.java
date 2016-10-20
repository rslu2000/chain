import com.chain.api.*;
import com.chain.http.*;
import com.chain.signing.*;

class Keys {
  public static void main(String[] args) throws Exception {
    Context context = new Context();

    // snippet create-key
    MockHsm.Key key = MockHsm.Key.create(context);
    // endsnippet

    // snippet signer-add-key
    HsmSigner.addKey(key);
    // endsnippet

    new Asset.Builder()
      .setAlias("gold")
      .addRootXpub(key.xpub)
      .setQuorum(1)
      .create(context);
    new Account.Builder()
      .setAlias("alice")
      .addRootXpub(key.xpub)
      .setQuorum(1)
      .create(context);
    Transaction.Template unsigned = new Transaction.Builder()
      .addAction(new Transaction.Action.Issue()
        .setAssetAlias("gold")
        .setAmount(100)
      ).addAction(new Transaction.Action.ControlWithAccount()
        .setAccountAlias("alice")
        .setAssetAlias("gold")
        .setAmount(100)
      ).build(context);

    // snippet sign-transaction
    Transaction.Template signed = HsmSigner.sign(unsigned);
    // endsnippet
  }
}
