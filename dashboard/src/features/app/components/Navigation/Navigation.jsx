import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import styles from './Navigation.scss'
import { humanizeDuration } from 'utility/time'

class Navigation extends React.Component {
  render() {
    const {
      snapshot,
      generatorBlockHeight,
      blockHeight,
      showSync,
      syncEstimates,
    } = this.props

    let syncContent

    if (showSync) {
      if (snapshot && snapshot.in_progress) { // Currently downloading the snapshot.
        const downloaded = (snapshot.downloaded / snapshot.size) * 100
        const timeRemaining = syncEstimates.snapshot ? humanizeDuration(syncEstimates.snapshot) : '-'

        syncContent = <ul className={styles.navigation}>
          <li className={styles.navigationTitle}>snapshot sync</li>
          <li>{snapshot.height} blocks</li>
          <li>{downloaded.toFixed(1)}% downloaded</li>
          <li>Time remaining: {timeRemaining}</li>
        </ul>
      } else { // Using RPC sync. Either there was no snapshot, or we've already stopped downloading it.
        // TODO(jeffomatic): Show a warning if the snapshot did not succeed.
        let replicaLag = generatorBlockHeight - blockHeight
        if (isNaN(replicaLag)) {
          replicaLag = '-'
        }
        const timeRemaining = syncEstimates.replicaLag ? humanizeDuration(syncEstimates.replicaLag) : '-'

        syncContent = <ul className={styles.navigation}>
          <li className={styles.navigationTitle}>generator sync</li>
          <li>Blocks behind: {replicaLag}</li>
          <li>Time remaining: {timeRemaining}</li>
        </ul>
      }
    }

    return (
      <div className={styles.main}>
        <ul className={styles.navigation}>
          <li className={styles.navigationTitle}>blockchain data</li>
          <li>
            <Link to='/transactions' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-transfer ${styles.glyphicon}`} />
              Transactions
            </Link>
          </li>
          <li>
            <Link to='/assets' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-file ${styles.glyphicon}`} />
              Assets
            </Link>
          </li>
          <li>
            <Link to='/accounts' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-user ${styles.glyphicon}`} />
              Accounts
            </Link>
          </li>
          <li>
            <Link to='/balances' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-stats ${styles.glyphicon}`} />
              Balances
            </Link>
          </li>
          <li>
            <Link to='/unspents' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-th-list ${styles.glyphicon}`} />
              Unspent Outputs
            </Link>
          </li>
        </ul>

        <ul className={styles.navigation}>
          <li className={styles.navigationTitle}>configuration</li>
          <li>
            <Link to='/mockhsms' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-lock ${styles.glyphicon}`} />
              Mock HSM
            </Link>
          </li>
          <li>
            <Link to='/transaction-feeds' activeClassName={styles.active}>
              <span className={`glyphicon glyphicon-th-list ${styles.glyphicon}`} />
              Transaction Feeds
            </Link>
          </li>
        </ul>
        <ul className={styles.navigation}>
          <li className={styles.navigationTitle}>developers</li>
          <li>
            <a href='/docs' target='_blank'>
              <span className={`glyphicon glyphicon-book ${styles.glyphicon}`} />
              Documentation
            </a>
          </li>
          <li>
            <a href='https://chain.com/support' target='_blank'>
              <span className={`glyphicon glyphicon-earphone ${styles.glyphicon}`} />
              Support
            </a>
          </li>
        </ul>

        {syncContent}
      </div>
    )
  }
}

export default connect(
  (state) => ({
    blockHeight: state.core.blockHeight,
    generatorBlockHeight: state.core.generatorBlockHeight,
    showSync: state.core.configured && !state.core.generator,
    snapshot: state.core.snapshot,
    syncEstimates: state.core.syncEstimates,
  })
)(Navigation)

