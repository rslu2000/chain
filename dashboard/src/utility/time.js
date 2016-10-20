/**
 * Calculates the average change per second of a variable sampled at various times.
 */
 class SpeedEstimator {
  constructor({sampleTtl = 60*1000, maxSamples = 60, minSamples = 3} = {}) {
    this.sampleTtl = sampleTtl
    this.maxSamples = maxSamples
    this.minSamples = minSamples
    this.samples = []
  }

  sample(value) {
    this.samples.push({
      value,
      time: Date.now(),
    })

    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }

    return this.average()
  }

  /**
   * Returns the average growth of the value per second.
   */
  average() {
    const cutoff = Date.now() - this.sampleTtl
    let earliest = null
    let latest = null
    let validSamples = 0

    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i]
      if (s.time < cutoff) continue
      if (earliest === null) earliest = s

      latest = s
      validSamples++
    }

    if (earliest === null || earliest === latest || validSamples < this.minSamples) {
      return NaN
    }

    return 1000 * (latest.value - earliest.value) / (latest.time - earliest.time)
  }
}

const humanizeTime = seconds => {
  let big, little, bigUnit, littleUnit

  if (seconds > 24 * 60 * 60) {
    big = seconds / (24 * 60 * 60)
    little = seconds % (24 * 60 * 60)
    bigUnit = 'd'
    littleUnit = 'h'
  } else if (seconds > 60 * 60) {
    big = seconds / (60 * 60)
    little = seconds % (60 * 60)
    bigUnit = 'h'
    littleUnit = 'm'
  } else if (seconds > 60) {
    big = seconds / 60
    little = seconds % 60
    bigUnit = 'm'
    littleUnit = 's'
  } else {
    return `${Math.round(seconds)}s`
  }

  big = Math.floor(big)
  little = Math.round(little)

  if (big > 9) {
    return `${big}${bigUnit}`
  }

  return `${big}${bigUnit} ${little}${littleUnit}`
}

export {
  SpeedEstimator,
  humanizeTime,
}
