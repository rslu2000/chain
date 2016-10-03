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
  static String asset = "asset";
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
    HsmSigner.addKey(key);

    new Account.Builder().addRootXpub(key.xpub).setAlias(alice).setQuorum(1).create(ctx);

    new Asset.Builder()
        .addRootXpub(key.xpub)
        .setAlias(asset)
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
        final long amount = 1000;
        Transaction.Template txTmpl =
            new Transaction.Builder()
                .addAction(new Transaction.Action.Issue().setAssetAlias(asset).setAmount(amount))
                .addAction(
                    new Transaction.Action.ControlWithAccount()
                        .setAccountAlias(alice)
                        .setAssetAlias(asset)
                        .setAmount(amount)
                        .addReferenceDataField("core", "ccte")
                        .addReferenceDataField("token", token))
                .addAction(
                    new Transaction.Action.SetTransactionReferenceData()
                        .addReferenceDataField("core", "ccte")
                        .addReferenceDataField("token", token))
                .build(ctx);
        Transaction.Template signedTpl = HsmSigner.sign(txTmpl);
        Transaction.SubmitResponse tx = Transaction.submit(ctx, signedTpl);
      } catch (Exception e) {
        System.out.println(e);
      }
    }
  }
}
