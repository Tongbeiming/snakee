$(function () {
  var LINE_WIDTH = 1 // 线条宽度
  var LINE_MAX_NUM = 32 // 一行格子数量
  var SNAKE_START_POINT = [[0, 3], [1, 3], [2, 3], [3, 3]] // 初始蛇坐标
  var DIR_ENUM = { UP: 1, DOWN: -1, LEFT: 2, RIGHT: -2 }    // 移动的四个方向枚举值，两个对立方向相加等于0
  var GAME_STATE_ENUM = { END: 1, READY: 2 } // 游戏状态枚举
  var canvasHeight = $('canvas').height() // 获取canvas的高度
  var canvasWidth = $('canvas').width() // 获取canvas的宽度
  var gridWidth = (canvasWidth - LINE_WIDTH) / LINE_MAX_NUM // 格子宽度，按一行32个格子计算
  var num = { w: LINE_MAX_NUM, h: Math.floor((canvasHeight - LINE_WIDTH) / gridWidth) } // 计算横向和纵向多少个格子，即：横坐标的最大值和纵坐标的最大值
  var directionNow = null // 当前移动移动方向
  var directionNext = null // 下一步移动方向
  var gameState = null // 游戏状态
  var scope = 0 // 分数
  var maxScope = 0 // 最高分
  var questionsUsed = [];
  var questions = [
    {
      question: "入院前需要携带哪些物品",
      options: {
        A: "洗漱用品",
        B: "换洗衣服",
        C: "卫生纸、糖果类",
        D: "以上都是"
      },
      answer: "D"
    },
    {
      question: "患者入院多长时间内登记医保：",
      options: {
        A: "入院12小时内",
        B: "入院24小时内",
        C: "入院48小时内",
        D: "出院前登记"
      },
      answer: "B"
    },
    {
      question: "患者入院前需要禁食、禁饮吗",
      options: {
        A: "需要（抽血化验等一系列检查需要空腹去做）",
        B: "不需要",
        C: "禁食不禁饮",
        D: "不禁食禁饮"
      },
      answer: "A"
    },
    {
      question: "手术患者住院时间一般为多少天",
      options: {
        A: "1-2天",
        B: "3-5天",
        C: "7-10天",
        D: "14天"
      },
      answer: "C"
    },
    {
      question: "患者入院后都做哪些检查",
      options: {
        A: "心电图",
        B: "胸片",
        C: "抽血化验",
        D: "以上都是"
      },
      answer: "D"
    },
    {
      question: "择期手术患者抽血后能吃东西吗",
      options: {
        A: "能（清淡饮食）",
        B: "能（随意饮食）",
        C: "不能",
        D: "看情况而定"
      },
      answer: "A"
    },
    {
      question: "术前会怎么清肠呢",
      options: {
        A: "口服聚乙二醇电解质散",
        B: "大肠水疗",
        C: "浣肠",
        D: "以上都是"
      },
      answer: "D"
    },
    {
      question: "患者手术前一天需要控制饮食吗",
      options: {
        A: "需要（术前少渣饮食、清淡饮食，避免影响手术）",
        B: "需要（术前高纤维饮食，高蛋白饮食，避免影响手术）",
        C: "需要（术前不暴饮暴食就好）",
        D: "不需要"
      },
      answer: "A"
    },
    {
      question: "术后多长时间可以喝水",
      options: {
        A: "术后2小时",
        B: "术后4小时",
        C: "术后5小时",
        D: "术后立即"
      },
      answer: "A"
    },
    {
      question: "术后多长时间可以下床活动",
      options: {
        A: "术后立即",
        B: "术后第二天(早起下床活动，有利于血液流通，预防静脉栓塞)",
        C: "术后第三天",
        D: "术后一周"
      },
      answer: "B"
    },
  ];
  var isPaused = false // 是否暂停游戏

  /**
 * 绘制格子地图
 * @param graphics
 */
  function drawGrid(graphics) {
    var wNum = num.w
    var hNum = num.h
    graphics.setStrokeStyle(LINE_WIDTH).beginStroke('#ffac52')
    // 画横向的线条
    for (var i = 0; i <= hNum; i++) {
      if (i === hNum || i === 0) graphics.setStrokeStyle(LINE_WIDTH)
      if (i === 1) graphics.setStrokeStyle(0.1)
      graphics.moveTo(LINE_WIDTH / 2, i * gridWidth + LINE_WIDTH / 2)
        .lineTo(gridWidth * wNum + LINE_WIDTH / 2, i * gridWidth + LINE_WIDTH / 2)
    }
    graphics.setStrokeStyle(LINE_WIDTH)
    // 画纵向的线条
    for (i = 0; i <= wNum; i++) {
      if (i === wNum || i === 0) graphics.setStrokeStyle(LINE_WIDTH)
      if (i === 1) graphics.setStrokeStyle(.1)
      graphics.moveTo(i * gridWidth + LINE_WIDTH / 2, LINE_WIDTH / 2)
        .lineTo(i * gridWidth + LINE_WIDTH / 2, gridWidth * hNum + LINE_WIDTH / 2)
    }
  }

  /** 
   * 坐标类
   */
  function Point(x, y) {
    this.x = x
    this.y = y
  }

  /**
   * 根据移动的方向，获取当前坐标的下一个坐标
   * @param direction 移动的方向
   */
  Point.prototype.nextPoint = function nextPoint(direction) {
    var point = new Point(this.x, this.y)
    switch (direction) {
      case DIR_ENUM.UP:
        point.y -= 1
        break
      case DIR_ENUM.DOWN:
        point.y += 1
        break
      case DIR_ENUM.LEFT:
        point.x -= 1
        break
      case DIR_ENUM.RIGHT:
        point.x += 1
        break
    }
    return point
  }

  /**
 * 初始化蛇的坐标
 * @returns {[Point,Point,Point,Point,Point ...]}
 * @private
 */
  function initSnake() {
    return SNAKE_START_POINT.map(function (item) {
      scope = 0
      return new Point(item[0], item[1])
    })
  }

  /**
   * 绘制蛇
   * @param graphics
   * @param snakes // 蛇坐标
   */
  function drawSnake(graphics, snakes) {
    graphics.clear()
    graphics.beginFill("#a088ff")
    var len = snakes.length
    for (var i = 0; i < len; i++) {
      if (i === len - 1) graphics.beginFill("#ff6ff9")
      graphics.drawRect(
        snakes[i].x * gridWidth + LINE_WIDTH / 2,
        snakes[i].y * gridWidth + LINE_WIDTH / 2,
        gridWidth, gridWidth)
    }
  }

 /**
 * 改变蛇身坐标
 * @param snakes 蛇坐标集
 * @param fruits 食物坐标集
 * @param direction 方向
 * @param fruitGraphics 食物图形
 */
function updateSnake(snakes, fruits, direction, fruitGraphics) {
  var oldHead = snakes[snakes.length - 1]
  var newHead = oldHead.nextPoint(direction)

  // 超出边界 游戏结束
  if (newHead.x < 0 || newHead.x >= num.w || newHead.y < 0 || newHead.y >= num.h) {
    gameState = GAME_STATE_ENUM.END
  } else if (snakes.some(function (p) { // ‘吃’到自己 游戏结束
    return newHead.x === p.x && newHead.y === p.y
  })) {
    gameState = GAME_STATE_ENUM.END
  } else {
    var isEaten = false
    var index = -1
    fruits.forEach(function (p, i) {
      if (newHead.x === p.x && newHead.y === p.y) {
        isEaten = true
        index = i
      }
    })

    if (isEaten) {
      var score = 1;
      if (fruits[index].color === 'yellow') {
        score = 5;
        isPaused = true; // 暂停游戏
        var randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        swal({
          text: randomQuestion.question,
          buttons: {
            A: {
              text: randomQuestion.options.A,
              value: 'A',
              className: 'swal-button',
            },
            B: {
              text: randomQuestion.options.B,
              value: 'B',
              className: 'swal-button',
            },
            C: {
              text: randomQuestion.options.C,
              value: 'C',
              className: 'swal-button',
            },
            D: {
              text: randomQuestion.options.D,
              value: 'D',
              className: 'swal-button',
            },
          },
        }).then(function (value) {
          // 根据用户的选择来更新 isPaused 变量
          if (value === randomQuestion.answer) {
            updateScope(5); // 回答正确，加5分
      } else {
        updateScope(-2); // 回答错误，扣2分
      }
      isPaused = false; // 继续游戏
      // 调用 start 函数来决定游戏是否应该继续
      start(snakeGraphics, fruitGraphics, snakes, fruits, stage);
    });
      } else {
        updateScope(score);
      }
      snakes.push(newHead);
      fruits.splice(index, 1);
      var newFruit = createFruit(snakes, fruits);
      if (newFruit) {
        fruits.push(newFruit);
        drawFruit(fruitGraphics, fruits);
      }
    } else {
      snakes.push(newHead);
      snakes.shift();
    }
  }
}

  /**
   * 引擎
   * @param graphics
   * @param snakes
   */
  function start(snakeGraphics, fruitGraphics, snakes, fruits, stage) {
    clearTimeout(window._engine) // 重启时关停之前的引擎
    run()
    function run() {
      directionNow = directionNext
      if (!isPaused) { // 当游戏未暂停时，更新蛇的位置
        updateSnake(snakes, fruits, directionNow, fruitGraphics) // 更新蛇坐标
      }
      if (gameState === GAME_STATE_ENUM.END) {
        end()
      } else {
        drawSnake(snakeGraphics, snakes)
        stage.update()
        window._engine = setTimeout(run, 500 * Math.pow(0.9, scope))
         // 如果 questionsUsed 数组中的题目已经全部使用过，则清空数组，重新开始
      if (questionsUsed.length === questions.length) {
        questionsUsed = [];
      }
      // 随机抽取一个未使用过的题目，并将其加入 questionsUsed 数组
      var unusedQuestions = questions.filter(function (q) {
        return questionsUsed.indexOf(q) === -1;
      });
      
      var question = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
      
      questionsUsed.push(question);
      
    }
  }
}

  /**
   * 游戏结束回调
   */
  function end() {
    gameState = GAME_STATE_ENUM.END
    var text = '当前分数：' + scope + '分'
    if (scope > maxScope) {
      text = '新记录！' + text
    }
    swal(text, {
      button: { text: '确定' },
    })
    renderHistory(scope)
    $('#MenuArea').show()
  }

  /**
   * 改变蛇行进方向
   * @param dir
   */
  function changeDirection(dir) {
    /* 逆向及同向则不改变 */
    if (directionNow + dir === 0 || directionNow === dir) return
    directionNext = dir
  }

  /**
   * 绑定相关元素点击事件
   */
  function bindEvent() {
    $('#UpBtn').click(function () { changeDirection(DIR_ENUM.UP) })
    $('#LeftBtn').click(function () { changeDirection(DIR_ENUM.LEFT) })
    $('#RightBtn').click(function () { changeDirection(DIR_ENUM.RIGHT) })
    $('#DownBtn').click(function () { changeDirection(DIR_ENUM.DOWN) })
    $('#EndBtn').click(end)
    $('#StartBtn').click(function () {
      $('#MenuArea').hide()
      init()
    })
    var id = null
    $(window).resize(function () {
      // 事件防抖
      if (id) {
        clearTimeout(id)
      }
      id = setTimeout(function () {
        id = null
        swal('当前窗口大小发生调整，页面将刷新！', {
          button: { text: '确定' },
        }).then(function () {
          location.href = location.href
        })
      }, 1000)
    })
    // 监听上下左右按钮
    $(window).keydown(function (e) {
      switch (e.keyCode) {
        case 37:
          changeDirection(DIR_ENUM.LEFT)
          $('#LeftBtn').eq(0).focus()
          break
        case 38:
          changeDirection(DIR_ENUM.UP)
          $('#UpBtn').eq(0).focus()
          break
        case 39:
          changeDirection(DIR_ENUM.RIGHT)
          $('#RightBtn').eq(0).focus()
          break
        case 40:
          changeDirection(DIR_ENUM.DOWN)
          $('#DownBtn').eq(0).focus()
          break
      }
    })
  }

/**
 * 生成一个新的水果
 * @param snakes 蛇坐标集
 * @param fruits 已有水果集合
 * @returns {{x: number, y: number}}
 */
function createFruit(snakes, fruits) {
  var fruit = null
  do {
    fruit = {
      x: Math.floor(Math.random() * num.w),
      y: Math.floor(Math.random() * num.h),
      color: 'green'
    }
    // 如果新生成的水果与蛇或已有的水果重叠，则重新生成
  } while (snakes.some(function (p) {
    return fruit.x === p.x && fruit.y === p.y
  }) || fruits.some(function (p) {
    return fruit.x === p.x && fruit.y === p.y
  }))

  // 生成黄色水果的概率为1/3
  if (Math.random() < 1 / 3) {
    fruit.color = 'yellow'
  }

  return fruit
}

/**
 * 绘制所有的水果
 * @param graphics
 * @param fruits
 */
function drawFruit(graphics, fruits) {
  graphics.clear()
  for (var i = 0; i < fruits.length; i++) {
    var fruit = fruits[i]
    graphics.beginFill(fruit.color)
    graphics.drawRect(
      fruit.x * gridWidth + LINE_WIDTH / 2,
      fruit.y * gridWidth + LINE_WIDTH / 2,
      gridWidth,
      gridWidth
    )
  }
}

  /**
   * 更新页面中显示的分数
   */
  function updateScope(num) {
    if (num !== undefined) scope += num
    else
      scope++
    $('#scope').text(scope)
  }

  /** 更新历史记录 */
  function renderHistory(scope) {
    var history = localStorage.getItem('HISTORY')
    try {
      history = JSON.parse(history)
    } catch (err) {
      history = []
    }
    history = history || []
    maxScope = history[0] || 0
    if (scope) {
      history.push(scope)
      history.sort(function (a, b) {
        return b - a
      })
      history.splice(3, 1)
      window.localStorage.setItem('HISTORY', JSON.stringify(history))
    }
    $('#HistoryArea').empty()
    history.forEach(function (scope, index) {
      $('#HistoryArea').append('<p>' + (index + 1) + '：' + scope + '分</p>')
    })
    if (!history.length) {
      $('#HistoryArea').append('<p>暂无记录</p>')
    }
  }

  function init() {
    $('canvas').attr('width', canvasWidth) // 给canvas设置宽高属性赋值上当前canvas的宽度和高度（单用样式配置宽高会被拉伸）
    $('canvas').attr('height', canvasHeight)
    directionNow = directionNext = DIR_ENUM.DOWN // 初始化蛇的移动方向
    gameState = GAME_STATE_ENUM.READY
    updateScope(0)
    var snakes = initSnake()
    var fruits = []
    fruits.push(createFruit(snakes, fruits))
    fruits.push(createFruit(snakes, fruits))
    var stage = new createjs.Stage($('canvas')[0])
    var grid = new createjs.Shape()
    var snake = new createjs.Shape()
    var fruit = new createjs.Shape()
    drawGrid(grid.graphics) // 绘制格子
    drawSnake(snake.graphics, snakes)
    drawFruit(fruit.graphics, fruits)
    stage.addChild(grid)
    stage.addChild(snake)
    stage.addChild(fruit)
    stage.update()
    start(snake.graphics, fruit.graphics, snakes, fruits, stage)
  }
  renderHistory()
  bindEvent()
})