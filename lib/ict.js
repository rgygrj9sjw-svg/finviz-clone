// ICT (Inner Circle Trader) Analysis Library

// =============================================
// QUADRANT & RANGE CALCULATIONS
// =============================================

export function calculate20DayLookBack(dailyBars) {
  if (dailyBars.length < 20) return null

  const last20 = dailyBars.slice(-20)
  const high = Math.max(...last20.map(b => b.h))
  const low = Math.min(...last20.map(b => b.l))
  const range = high - low

  return {
    high,
    low,
    range,
    upperQuadrant: low + range * 0.75,    // 75%
    equilibrium: low + range * 0.5,        // 50% (CE)
    lowerQuadrant: low + range * 0.25,     // 25%
    getPosition: (price) => {
      const position = ((price - low) / range) * 100
      if (position >= 75) return { zone: 'Premium', pct: position }
      if (position >= 50) return { zone: 'Upper Mid', pct: position }
      if (position >= 25) return { zone: 'Lower Mid', pct: position }
      return { zone: 'Discount', pct: position }
    }
  }
}

export function gradeWick(candle) {
  const range = candle.h - candle.l
  const body = Math.abs(candle.c - candle.o)
  const upperWick = candle.h - Math.max(candle.o, candle.c)
  const lowerWick = Math.min(candle.o, candle.c) - candle.l

  return {
    range,
    body,
    upperWick,
    lowerWick,
    upperQuadrant: candle.l + range * 0.75,
    equilibrium: candle.l + range * 0.5,
    lowerQuadrant: candle.l + range * 0.25,
    isBullish: candle.c > candle.o,
    isBearish: candle.c < candle.o,
  }
}

// =============================================
// FAIR VALUE GAPS (FVG)
// =============================================

export function findFairValueGaps(bars) {
  const fvgs = []

  for (let i = 2; i < bars.length; i++) {
    const c1 = bars[i - 2] // First candle
    const c2 = bars[i - 1] // Middle candle (the gap)
    const c3 = bars[i]     // Third candle

    // Bullish FVG: C1 high < C3 low (gap up)
    if (c1.h < c3.l) {
      fvgs.push({
        type: 'bullish',
        high: c3.l,
        low: c1.h,
        ce: (c3.l + c1.h) / 2,
        timestamp: c2.t,
        candle: c2,
      })
    }

    // Bearish FVG: C1 low > C3 high (gap down)
    if (c1.l > c3.h) {
      fvgs.push({
        type: 'bearish',
        high: c1.l,
        low: c3.h,
        ce: (c1.l + c3.h) / 2,
        timestamp: c2.t,
        candle: c2,
      })
    }
  }

  return fvgs
}

// =============================================
// SUSPENSION BLOCKS (V7.0 - ICT's NEW Concept)
// =============================================

export function findSuspensionBlocks(bars) {
  const suspensionBlocks = []

  for (let i = 1; i < bars.length - 1; i++) {
    const prevCandle = bars[i - 1]
    const candle = bars[i]
    const nextCandle = bars[i + 1]

    // Volume Imbalance at BOTTOM: gap between candle's low and prior candle's high
    const hasBottomVI = candle.l > prevCandle.h

    // Volume Imbalance at TOP: gap between candle's high and next candle's low
    const hasTopVI = candle.h < nextCandle.l

    // Suspension Block = VI at BOTH top and bottom
    if (hasBottomVI && hasTopVI) {
      const isBullish = candle.c > candle.o
      suspensionBlocks.push({
        type: isBullish ? 'bullish' : 'bearish',
        high: candle.h,
        low: candle.l,
        ce: (candle.h + candle.l) / 2,
        upperQuadrant: candle.l + (candle.h - candle.l) * 0.75,
        lowerQuadrant: candle.l + (candle.h - candle.l) * 0.25,
        timestamp: candle.t,
        candle,
        // ICT says prior wicks DON'T invalidate suspension blocks
        note: "EXTREMELY STRONG - prior wicks don't invalidate",
      })
    }
  }

  return suspensionBlocks
}

// =============================================
// ORDER BLOCKS
// =============================================

export function findOrderBlocks(bars) {
  const orderBlocks = []

  for (let i = 1; i < bars.length - 1; i++) {
    const candle = bars[i]
    const nextCandle = bars[i + 1]

    // Bullish OB: Last bearish candle before bullish expansion
    if (candle.c < candle.o && nextCandle.c > nextCandle.o) {
      const displacement = nextCandle.c - nextCandle.o
      const avgRange = bars.slice(Math.max(0, i - 5), i).reduce((sum, b) => sum + (b.h - b.l), 0) / 5

      // Check for displacement (move > 1.5x average range)
      if (displacement > avgRange * 1.5) {
        orderBlocks.push({
          type: 'bullish',
          high: candle.h,
          low: candle.l,
          openingPrice: candle.o,
          meanThreshold: (candle.h + candle.l) / 2,
          timestamp: candle.t,
          candle,
        })
      }
    }

    // Bearish OB: Last bullish candle before bearish expansion
    if (candle.c > candle.o && nextCandle.c < nextCandle.o) {
      const displacement = nextCandle.o - nextCandle.c
      const avgRange = bars.slice(Math.max(0, i - 5), i).reduce((sum, b) => sum + (b.h - b.l), 0) / 5

      if (displacement > avgRange * 1.5) {
        orderBlocks.push({
          type: 'bearish',
          high: candle.h,
          low: candle.l,
          openingPrice: candle.o,
          meanThreshold: (candle.h + candle.l) / 2,
          timestamp: candle.t,
          candle,
        })
      }
    }
  }

  return orderBlocks
}

// =============================================
// BREAKER BLOCKS
// =============================================

export function findBreakerBlocks(bars, orderBlocks) {
  const breakers = []

  for (const ob of orderBlocks) {
    // Find if price later broke through this OB
    const obIndex = bars.findIndex(b => b.t === ob.timestamp)
    if (obIndex === -1) continue

    for (let i = obIndex + 2; i < bars.length; i++) {
      const candle = bars[i]

      // Bullish OB becomes bearish breaker if price closes below
      if (ob.type === 'bullish' && candle.c < ob.low) {
        breakers.push({
          type: 'bearish',
          high: ob.high,
          low: ob.low,
          origin: 'failed bullish OB',
          timestamp: candle.t,
        })
        break
      }

      // Bearish OB becomes bullish breaker if price closes above
      if (ob.type === 'bearish' && candle.c > ob.high) {
        breakers.push({
          type: 'bullish',
          high: ob.high,
          low: ob.low,
          origin: 'failed bearish OB',
          timestamp: candle.t,
        })
        break
      }
    }
  }

  return breakers
}

// =============================================
// LIQUIDITY LEVELS
// =============================================

export function find3DayLiquidityMatrix(dailyBars) {
  if (dailyBars.length < 3) return null

  const day1 = dailyBars[dailyBars.length - 1] // Today
  const day2 = dailyBars[dailyBars.length - 2] // Yesterday
  const day3 = dailyBars[dailyBars.length - 3] // Day before

  return {
    day1: { high: day1.h, low: day1.l, date: day1.t },
    day2: { high: day2.h, low: day2.l, date: day2.t },
    day3: { high: day3.h, low: day3.l, date: day3.t },
    rangeHigh: Math.max(day1.h, day2.h, day3.h),
    rangeLow: Math.min(day1.l, day2.l, day3.l),
    buySide: [
      { level: Math.max(day1.h, day2.h, day3.h), label: 'Buy Side 1 (3-Day High)' },
      { level: Math.min(day1.h, day2.h, day3.h), label: 'Buy Side 2 (Lowest Daily High)' },
    ],
    sellSide: [
      { level: Math.min(day1.l, day2.l, day3.l), label: 'Sell Side 1 (3-Day Low)' },
      { level: Math.max(day1.l, day2.l, day3.l), label: 'Sell Side 2 (Highest Daily Low)' },
    ],
  }
}

// =============================================
// WEEKLY STRUCTURE CHECK (MANDATORY RULE 1)
// =============================================

export function analyzeWeeklyStructure(weeklyBars) {
  if (weeklyBars.length < 2) return null

  const currentWeek = weeklyBars[weeklyBars.length - 1]
  const prevWeek = weeklyBars[weeklyBars.length - 2]

  const range = currentWeek.h - currentWeek.l
  const closePosition = ((currentWeek.c - currentWeek.l) / range) * 100

  let character, action
  if (closePosition >= 75) {
    character = 'BULLISH'
    action = 'Can look for longs'
  } else if (closePosition <= 25) {
    character = 'BEARISH'
    action = 'DO NOT CALL BULLISH - Sellers in control'
  } else {
    character = 'NEUTRAL'
    action = 'Wait for confirmation'
  }

  // Check for engulfing
  const isBearishEngulfing = currentWeek.c < currentWeek.o &&
    currentWeek.o > prevWeek.c && currentWeek.c < prevWeek.o

  const isBullishEngulfing = currentWeek.c > currentWeek.o &&
    currentWeek.o < prevWeek.c && currentWeek.c > prevWeek.o

  return {
    open: currentWeek.o,
    high: currentWeek.h,
    low: currentWeek.l,
    close: currentWeek.c,
    closePosition: closePosition.toFixed(1) + '%',
    closeZone: closePosition >= 75 ? 'Upper 25%' : closePosition <= 25 ? 'Lower 25%' : 'Middle 50%',
    character,
    action,
    isBearishEngulfing,
    isBullishEngulfing,
    warning: closePosition <= 25 ? 'Weekly close at lows = DISTRIBUTION, not stop hunt' : null,
  }
}

// =============================================
// MARKET MAKER MODEL DETECTION
// =============================================

export function detectMarketMakerModel(bars) {
  if (bars.length < 10) return null

  const recentBars = bars.slice(-20)

  // Find significant low (potential SMR for MMBM)
  let lowestIdx = 0
  let lowestLow = Infinity
  for (let i = 0; i < recentBars.length - 3; i++) {
    if (recentBars[i].l < lowestLow) {
      lowestLow = recentBars[i].l
      lowestIdx = i
    }
  }

  // Find significant high (potential SMR for MMSM)
  let highestIdx = 0
  let highestHigh = -Infinity
  for (let i = 0; i < recentBars.length - 3; i++) {
    if (recentBars[i].h > highestHigh) {
      highestHigh = recentBars[i].h
      highestIdx = i
    }
  }

  // Check for bullish displacement after low
  const afterLow = recentBars.slice(lowestIdx + 1)
  const bullishDisplacement = afterLow.some((bar, i) => {
    if (i === 0) return false
    const prev = afterLow[i - 1]
    return bar.c > bar.o && (bar.c - bar.o) > (prev.h - prev.l) * 1.5
  })

  // Check for bearish displacement after high
  const afterHigh = recentBars.slice(highestIdx + 1)
  const bearishDisplacement = afterHigh.some((bar, i) => {
    if (i === 0) return false
    const prev = afterHigh[i - 1]
    return bar.c < bar.o && (bar.o - bar.c) > (prev.h - prev.l) * 1.5
  })

  const currentPrice = bars[bars.length - 1].c

  if (bullishDisplacement && currentPrice > lowestLow) {
    const dealingRange = { high: highestHigh, low: lowestLow }
    const position = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100

    let phase
    if (position < 25) phase = 'Low-Risk Entry Zone'
    else if (position < 50) phase = 'First Stage'
    else if (position < 75) phase = 'Second Stage (UNICORN potential)'
    else phase = 'Expansion / Distribution'

    return {
      model: 'MMBM',
      phase,
      dealingRange,
      position: position.toFixed(1) + '%',
      entryZone: { high: lowestLow + (highestHigh - lowestLow) * 0.25, low: lowestLow },
    }
  }

  if (bearishDisplacement && currentPrice < highestHigh) {
    const dealingRange = { high: highestHigh, low: lowestLow }
    const position = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100

    let phase
    if (position > 75) phase = 'Low-Risk Entry Zone (Short)'
    else if (position > 50) phase = 'First Stage'
    else if (position > 25) phase = 'Second Stage'
    else phase = 'Expansion / Distribution'

    return {
      model: 'MMSM',
      phase,
      dealingRange,
      position: position.toFixed(1) + '%',
      entryZone: { high: highestHigh, low: highestHigh - (highestHigh - lowestLow) * 0.25 },
    }
  }

  return { model: 'Consolidation', phase: 'Waiting for displacement' }
}

// =============================================
// LARGE RANGE DAY DETECTION
// =============================================

export function detectLargeRangeDay(dailyBars) {
  if (dailyBars.length < 10) return null

  const yesterday = dailyBars[dailyBars.length - 2]
  const avgRange = dailyBars.slice(-10, -1).reduce((sum, b) => sum + (b.h - b.l), 0) / 9
  const yesterdayRange = yesterday.h - yesterday.l

  const isLargeRange = yesterdayRange > avgRange * 1.5

  return {
    isLargeRangeDay: isLargeRange,
    yesterdayRange,
    avgRange,
    ratio: (yesterdayRange / avgRange).toFixed(2),
    warning: isLargeRange ?
      'LARGE RANGE DAY DETECTED - Morning session is HIGH RISK. Wait for PM session (1:30 PM+)' :
      null,
  }
}

// =============================================
// COMPLETE ICT ANALYSIS
// =============================================

export function runFullICTAnalysis(dailyBars, weeklyBars, currentPrice) {
  const lookBack = calculate20DayLookBack(dailyBars)
  const weeklyStructure = analyzeWeeklyStructure(weeklyBars)
  const fvgs = findFairValueGaps(dailyBars)
  const suspensionBlocks = findSuspensionBlocks(dailyBars)
  const orderBlocks = findOrderBlocks(dailyBars)
  const breakers = findBreakerBlocks(dailyBars, orderBlocks)
  const liquidityMatrix = find3DayLiquidityMatrix(dailyBars)
  const mmModel = detectMarketMakerModel(dailyBars)
  const largeRangeDay = detectLargeRangeDay(dailyBars)

  // Determine overall bias
  let bias = 'NEUTRAL'
  let confidence = 'Low'
  const warnings = []

  if (weeklyStructure) {
    if (weeklyStructure.character === 'BEARISH') {
      bias = 'BEARISH'
      warnings.push('Weekly close at lows = Distribution, not stop hunt')
    } else if (weeklyStructure.character === 'BULLISH') {
      bias = 'BULLISH'
    }

    if (weeklyStructure.isBearishEngulfing) {
      warnings.push('BEARISH ENGULFING on weekly - Strong sell signal')
    }
  }

  if (largeRangeDay?.isLargeRangeDay) {
    warnings.push(largeRangeDay.warning)
  }

  if (lookBack && mmModel?.model !== 'Consolidation') {
    confidence = 'Medium'
    if (suspensionBlocks.length > 0) {
      confidence = 'High'
    }
  }

  return {
    ticker: null, // Set externally
    currentPrice,
    bias,
    confidence,
    weeklyStructure,
    lookBack20Day: lookBack,
    suspensionBlocks: suspensionBlocks.slice(-5),
    fairValueGaps: fvgs.slice(-10),
    orderBlocks: orderBlocks.slice(-5),
    breakerBlocks: breakers.slice(-3),
    liquidityMatrix,
    marketMakerModel: mmModel,
    largeRangeDay,
    warnings,
  }
}
