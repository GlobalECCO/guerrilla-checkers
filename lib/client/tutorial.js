define(['underscore', 'lib/checkers'], function(_, Checkers) {

  function Tutorial() {
    var self = this;
    self.active = false;
    self.finished = false;
    self.script = [];
    self.timers = [];
    self.step = 0;
    self.socket = null;
    self.isSoldierPlayer = null;
    self.background = null;
    self.foreground = null;
    self.buttonContainer = null;
    self.gameState = null;

    self.textGuerrillaPieces = 'The Guerrilla player has 66 pieces that get placed 2 at a time on the corners of the board squares.';
    self.textStatePieces = 'The State player starts with 6 pre-placed pieces that move diagonally to other squares just like checkers.';
    self.textGuerrillaCapture = 'Guerrilla pieces capture State pieces when they are placed on all four corners around a State piece.';
    self.textStateCapture = 'State pieces capture Guerrilla pieces by jumping over them when making their move.';
    self.textStateContinueCapture = 'When a State piece captures a piece, it must continue capturing pieces as long as it can.';
    self.textEndGame = 'The game will end when the State loses all of its pieces (Guerrilla victory) or the Guerrilla player has placed all of its pieces and any State pieces remain (State victory).';
    self.textBoardEdges = 'Board edges count as capturing pieces for the Guerrilla player, so they only need two pieces to capture a piece on an edge or one for a piece in a corner.';

    self.opponentTurnSpeed = 750;

    //----------------------------------------------------------------------------
    Tutorial.prototype.initTutorialSteps = function() {
      if (self.isSoldierPlayer()) {
        self.initStateTutorialSteps();
      }
      else {
        self.initGuerrillaTutorialSteps();
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initStateTutorialSteps = function() {
      self.guerrillaPlaceFirstPieces();

      self.script = [
        // Step 1
        [{
          el: '#pieces .guerrilla_piece:eq(1)',
          tip: {
            title: 'Guerrilla Pieces',
            content: self.textGuerrillaPieces,
            tipJoint: 'top'
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '#pieces .soldier_piece:eq(5)',
          tip: {
            content: 'Click here to select a piece to move.',
            tipJoint: 'left'
          },
        }],

        // Step 2
        [{
          el: '#pieces .soldier_piece:eq(5)',
          tip: {
            title: 'State Pieces',
            content: self.textStatePieces,
            tipJoint: 'top'
          },
          action: null,
        },

        {
          el: '#soldier_moves .soldier_piece:eq(1)',
          tip: {
            content: 'Click here to move the piece.',
            tipJoint: 'right'
          },
          callback: self.guerrillaPlaceSecondPieces,
        }],

        // Step 3
        [{
          el: '#pieces .guerrilla_piece',
          grouped: true,
          tip: {
            title: 'Guerrilla Capture',
            content: self.textGuerrillaCapture,
            tipJoint: 'bottom',
            stemLength: 75,
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '#pieces .soldier_piece:eq(1)',
          tip: {
            content: 'Click here to select a piece to move.',
            tipJoint: 'left'
          },
        }],

        // Step 4
        [{
          el: '#soldier_moves .soldier_piece:eq(1)',
          tip: {
            title: 'State Capture',
            content: self.textStateCapture,
            tipJoint: 'bottom'
          },
          action: null,
        },

        {
          el: '#soldier_moves .soldier_piece:eq(1)',
          tip: {
            content: 'Click here to move the piece.',
            tipJoint: 'left'
          },
        }],

        // Step 5
        [{
          el: '#soldier_moves .soldier_piece:eq(0)',
          tip: {
            title: 'Continuing Capture',
            content: self.textStateContinueCapture,
            tipJoint: 'left'
          },
          action: null,
        },

        {
          el: '#soldier_moves .soldier_piece:eq(0)',
          tip: {
            content: 'Click here to move the piece.',
            tipJoint: 'top'
          },
          callback: self.guerrillaPlaceThirdPieces,
        }],

        // Step 6
        [{
          el: '#soldier_status, #guerrilla_reserves',
          grouped: true,
          tip: {
            title: 'Game End',
            content: self.textEndGame,
            tipJoint: 'right'
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '#pieces .soldier_piece:eq(4)',
          tip: {
            content: 'Click here to select a piece to move.',
            tipJoint: 'left'
          },
        }],

        // Step 7
        [{
          el: '#soldier_moves .soldier_piece:eq(2)',
          tip: {
            content: 'Click here to move the piece.',
            tipJoint: 'left'
          },
          callback: self.guerrillaPlaceFourthPieces,
        }],

        // Step 8
        [{
          el: '#pieces .guerrilla_piece:eq(3), #pieces .guerrilla_piece:eq(4)',
          grouped: true,
          tip: {
            title: 'Board Edges',
            content: self.textBoardEdges,
            tipJoint: 'bottom'
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '.endTutorialButton:first',
          tip: {
            content: 'Click here to start playing the game.',
            tipJoint: 'bottom'
          },
        }],
      ];
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.placeGuerrillaPiece = function(position, speedMultiplier) {
      self.timers.push(setTimeout(function() {
        self.gameState.placeGuerrillaPiece(position);
        self.updatePlayer();
        self.timers.unshift();
      }, self.opponentTurnSpeed * speedMultiplier));
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.guerrillaPlaceFirstPieces = function() {
      self.placeGuerrillaPiece({x:3, y:2}, 1);
      self.placeGuerrillaPiece({x:2, y:2}, 2);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.guerrillaPlaceSecondPieces = function() {
      self.placeGuerrillaPiece({x:3, y:1}, 1);
      self.placeGuerrillaPiece({x:2, y:1}, 2);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.guerrillaPlaceThirdPieces = function() {
      self.placeGuerrillaPiece({x:3, y:1}, 1);
      self.placeGuerrillaPiece({x:3, y:0}, 2);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.guerrillaPlaceFourthPieces = function() {
      self.placeGuerrillaPiece({x:2, y:0}, 1);
      self.placeGuerrillaPiece({x:3, y:0}, 2);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initGuerrillaTutorialSteps = function() {
      self.script = [
        // Step 1
        [{
          el: '.guerrilla_shadow:eq(23)',
          tip: {
            title: 'Guerrilla Pieces',
            content: self.textGuerrillaPieces,
            tipJoint: 'bottom'
          },
          action: null,
        },

        {
          el: '.guerrilla_shadow:eq(23)',
          tip: {
            content: 'Click here to place your first piece.',
            tipJoint: 'left'
          },
        }],

        // Step 2
        [{
          el: '.guerrilla_shadow:eq(2)',
          tip: {
            content: 'Click here to place your second piece.',
            tipJoint: 'left'
          },
          callback: self.stateMoveFirstPiece,
        }],

        // Step 3
        [{
          el: '#pieces .soldier_piece:eq(5)',
          tip: {
            title: 'State Pieces',
            content: self.textStatePieces,
            tipJoint: 'left'
          },
          delay: self.opponentTurnSpeed * 2,
          action: null,
        },

        {
          el: '.guerrilla_shadow:eq(1)',
          tip: {
            content: 'Click here to place your first piece.',
            tipJoint: 'left'
          },
        }],

        // Step 4
        [{
          el: '.guerrilla_shadow:eq(0)',
          tip: {
            title: 'Guerrilla Capture',
            content: self.textGuerrillaCapture,
            tipJoint: 'top'
          },
          action: null,
        },

        {
          el: '.guerrilla_shadow:eq(0)',
          tip: {
            content: 'Click here to place your second piece.',
            tipJoint: 'left'
          },
          callback: self.stateMoveSecondPiece,
        }],

        // Step 5
        [{
          el: '.guerrilla_shadow:eq(4)',
          tip: {
            title: 'State Capture',
            content: self.textStateCapture + '  ' + self.textStateContinueCapture,
            tipJoint: 'bottom'
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '.guerrilla_shadow:eq(4)',
          tip: {
            content: 'Click here to place your first piece.',
            tipJoint: 'left'
          },
        }],

        // Step 6
        [{
          el: '.guerrilla_shadow:eq(1)',
          tip: {
            content: 'Click here to place your second piece.',
            tipJoint: 'left'
          },
          callback: self.stateMoveThirdPiece,
        }],


        // Step 7
        [{
          el: '.guerrilla_shadow:eq(2)',
          tip: {
            title: 'Board Edges',
            content: self.textBoardEdges,
            tipJoint: 'bottom'
          },
          delay: self.opponentTurnSpeed * 3,
          action: null,
        },

        {
          el: '.guerrilla_shadow:eq(2)',
          tip: {
            content: 'Click here to place your first piece.',
            tipJoint: 'left'
          },
        }],

        // Step 8
        [{
          el: '.guerrilla_shadow:eq(0)',
          tip: {
            content: 'Click here to place your second piece.',
            tipJoint: 'left'
          },
        }],

        // Step 9
        [{
          el: '#soldier_status, #guerrilla_reserves',
          grouped: true,
          tip: {
            title: 'Game End',
            content: self.textEndGame,
            tipJoint: 'right'
          },
          action: null,
        },

        {
          el: '.endTutorialButton:first',
          tip: {
            content: 'Click here to start playing the game.',
            tipJoint: 'bottom'
          },
        }],
      ];
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveSoldierPiece = function(piece, position, speedMultiplier) {
      self.timers.push(setTimeout(function() {
        self.gameState.moveSoldierPiece(piece, position);
        self.updatePlayer();
        self.timers.unshift();
      }, self.opponentTurnSpeed * speedMultiplier));
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.stateMoveFirstPiece = function() {
      self.moveSoldierPiece({x:4, y:5}, {x:3, y:6}, 1);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.stateMoveSecondPiece = function() {
      self.moveSoldierPiece({x:4, y:3}, {x:3, y:2}, 1);
      self.moveSoldierPiece({x:3, y:2}, {x:4, y:1}, 2);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.stateMoveThirdPiece = function() {
      self.moveSoldierPiece({x:4, y:1}, {x:3, y:0}, 1);
    };

    //----------------------------------------------------------------------------
    // Defined 'fake' server handlers for taking turns.
    self.serverHandlers = [
      {
        signal: 'placeGuerrilla',
        handler: function(piece) {
          return self.gameState.placeGuerrillaPiece(piece.position);
        },
      },
      {
        signal: 'moveCOIN',
        handler: function(data) {
          return self.gameState.moveSoldierPiece(data.piece, data.position);
        },
      },
    ];

    //----------------------------------------------------------------------------
    Tutorial.prototype.init = function(socket, isSoldierPlayerCB, updatePlayerCB, endTutorialCB) {
      self.socket = socket;
      self.isSoldierPlayer = isSoldierPlayerCB;
      self.updatePlayerCB = updatePlayerCB;
      self.endTutorialCB = endTutorialCB;

      self.ui = $("<div>\
                     <div class='tutorialBackground'/>\
                     <div class='tutorialForeground'>\
                     </div>\
                     <div class='tutorialButtonContainer'>\
                       <div class='tutorialLabel'>Tutorial Controls:</div>\
                       <div class='tutorialButton restartTutorialButton'>Restart Tutorial</div>\
                       <div class='tutorialButton endTutorialButton'>End Tutorial</div>\
                     </div>\
                   </div>");
      $('body').append(self.ui);

      self.background = self.ui.find('.tutorialBackground');
      self.foreground = self.ui.find('.tutorialForeground');
      self.buttonContainer = self.ui.find('.tutorialButtonContainer');
      self.buttonContainer.find('.restartTutorialButton').click(self.onRestartTutorial);
      self.buttonContainer.find('.endTutorialButton').click(self.onEndTutorial);

      self.ui.hide();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.isActive = function() {
      return self.active;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.isFinished = function() {
      return self.finished;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.beginTutorial = function() {
      self.active = true;
      self.adjustTutorialStyles();
      self.initCheckers();
      self.initTutorialSteps();
      self.updatePlayer();
      self.show();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initCheckers = function() {
      self.gameState = new Checkers.GameState();
    };

    //----------------------------------------------------------------------------
    // Script is an array that contains the contents of the entire tutorial.
    // See the bottom of this source for details on its structure.
    Tutorial.prototype.show = function() {
      self.finished = false;
      self.ui.show();

      self.performStep(0);
      $(window).on('resize.tutorial', this.onResize);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.hide = function() {
      self.ui.hide();
      $(window).off('resize.tutorial');
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.updatePlayer = function(result) {
      var data = {
        result: result,
        gameState: self.gameState.asDTO(self.role),
      };

      if (self.updatePlayerCB !== undefined) {
        self.updatePlayerCB(data);
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.emit = function(type, data) {
      for (var i = 0; i < self.serverHandlers.length; ++i) {
        if (self.serverHandlers[i].signal === type) {
          var result = self.serverHandlers[i].handler(data);
          setTimeout(function() {
              self.updatePlayer(result);
            }, 0);
          break;
        }
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onRestartTutorial = function() {
      self.onEndTutorial();
      self.beginTutorial();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onEndTutorial = function(isRestart) {
      self.active = false;
      self.finished = true;

      _.each(self.timers, function(timer) {
        clearTimeout(timer);
      });
      self.timers = [];
      self.background.empty();
      self.foreground.empty();
      Opentip.hideTips();
      self.hide();

      if (self.endTutorialCB !== undefined) {
        self.endTutorialCB();
      }

      if (isRestart !== undefined) {
        self.finished = true;
        self.initCheckers();
        self.updatePlayer();
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.performStep = function(step) {
      if (step > -1 && step < self.script.length) {
        self.step = step;
        var currentStep = self.script[step];

        //is this step an array of elements and tips?
        if (_.isArray(currentStep)) {
          var absTime = 0;

          _.each(currentStep, function(item){
            absTime += item.hasOwnProperty('delay') ? item.delay : 0;

            self.timers.push(setTimeout(function() {
              self.performItem(item);
              self.timers.unshift();
            }, absTime));
          });

        }
        else {
          this.timers.push(setTimeout(function() {
            self.performItem(currentStep);
            self.timers.unshift();
          }, currentStep.hasOwnProperty('delay') ? currentStep.delay : 0));
        }

        return;
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.performItem = function(item) {
      var $el = $(item.el);
      var $tooltipTarget = $el;

      if (item.hasOwnProperty('grouped') && item.grouped) {
        //gather boundaries
        var bbox = self.getBoundingBoxOfElements($el);

        //create bounding box around $el
        var $box = $("<div class='boundingBox'></div>")
        self.setCSSOfBoundingBox($box, bbox);

        self.background.append($box);
        $el.data('boundingBox', $box);
        $box.data('source', $el);

        //point the tooltip to this box
        $tooltipTarget = $box;
      }

      if (item.hasOwnProperty('tip')){
        if (item.tip.stemLength === undefined) {
          item.tip.stemLength = 50;
        }
        var t = new Opentip($tooltipTarget.get(0), item.tip.content, item.tip.title || '',
                            {
                              target: item.tip.target || $tooltipTarget.get(0),
                              group: null,
                              showOn:'creation',
                              hideOn: 'fakeEventThatDoesntExist',
                              removeElementsOnHide: true,
                              stemLength: item.tip.stemLength,
                              tipJoint: item.tip.tipJoint || 'top left',
                              offset: item.tip.offset || [0, 0],
                              delay: item.tip.delay || 0,
                              style: self.doesItemHaveNullAction(item) ? 'tutorialTips' : 'tutorialActionTips'
                            });
        $(t.container[0]).on('click.blockClick', self.onBlockClick);
      }

      $el.each(function() {
        self.cloneElement(this, item)
      });
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onBlockClick = function(event) {
      event.stopPropagation();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.getBoundingBoxOfElements = function($elements) {
      //gather boundaries
      var left = Number.MAX_VALUE;
      var right = Number.MIN_VALUE;
      var bottom = Number.MIN_VALUE;
      var top = Number.MAX_VALUE;

      _.each($elements, function(element){
        var rect = element.getBoundingClientRect();
        left = (rect.left < left) ? rect.left : left;
        right = (rect.right > right) ? rect.right : right;
        bottom = (rect.bottom > bottom) ? rect.bottom : bottom;
        top = (rect.top < top) ? rect.top : top;
      });

      return {left:left, right:right, top:top, bottom:bottom};
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.setCSSOfBoundingBox = function($el, bbox) {
      $el.css('left', bbox.left);
      $el.css('right', bbox.right);
      $el.css('top', bbox.top);
      $el.css('bottom', bbox.bottom);
      $el.css('width', bbox.right-bbox.left);
      $el.css('height', bbox.bottom-bbox.top);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.doesItemHaveNullAction = function(item) {
      //step has an action property and it's null, meaning there's no action to perform
      return (item.hasOwnProperty('action') &&
              (item.action == null));
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.cloneElement = function(element, item, alternate) {
      // Clone the element
      var $el = $(element);
      if (item.hasOwnProperty('shallowCopy') && item.shallowCopy) {
        var $clone = $(element.cloneNode(true));
      }
      else {
        var $clone = $el.clone(true);
      }
      $clone.data('source', $el);

      // Add the clone to the appropriate layer
      if (item.hasOwnProperty('action') && alternate === undefined) {
        self.background.append($clone);
        if (item.action !== null) {
          var alternateTarget = $(item.action)[0];
          self.cloneElement(alternateTarget, item, true);
        }
      }
      else {
        $clone.one('click', self.onFinished); //click handler
        self.foreground.append($clone);

        //Highlight the elements which have some action to perform and assign
        //a click handler
        var $box = $("<div class='highlightCircle'></div>")
        var bbox = self.getBoundingBoxOfElements($el);
        self.setCSSOfBoundingBox($box, bbox);
        $box.data('source', $el);
        self.foreground.append($box);
        $box.click(function() {
          $clone.click();
        });
      }

      // Now position the element
      $clone.copyCSS($el);
      $clone.css('transition', 'none');
      $clone.css('position', 'absolute');
      self.positionClone($clone, $el);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.positionClone = function($clone, $el) {
      $clone.offset($el.offset());
      $clone.css('width', $el.width());
      $clone.css('height', $el.height());
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.cleanUpElement = function($el) {
      if ($el.data('boundingBox')) {
        var $bbox = $el.data('boundingBox');
        $bbox.remove();
        $el.removeData('boundingBox');
      }

      Opentip.hideTips();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onResize = function() {
      setTimeout(function() {
        self.background.add(self.foreground).children().each(function() {
          if ($(this).hasClass('boundingBox') || $(this).hasClass('highlightCircle')) {
            self.setCSSOfBoundingBox($(this), self.getBoundingBoxOfElements($(this).data('source')));
          }
          else {
            self.positionClone($(this), $(this).data('source'));
          }
        });
        _.each(Opentip.tips, function(tip) {
          tip.reposition();
        });
      }, 0);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onFinished = function(event) {
      // Cleanup our previous clones
      self.background.empty();
      self.foreground.empty();

      // Move on to the next step of the tutorial
      if (_.isArray(self.script[self.step])) {
        _.each(self.script[self.step], function(item) {
          if (item.callback != null) {
            item.callback();
          }
          self.cleanUpElement($(item.el));
        });
      }
      else {
        if (self.script[self.step].callback != null) {
          self.script[self.step].callback();
        }
        self.cleanUpElement($(self.script[self.step].el));
      }

      self.step++;

      if (self.step < self.script.length) {
        self.performStep(self.step);
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.adjustTutorialStyles = function() {
      // Change the background style based on the player's role
      if (!self.background.hasClass('stateTutorialBackground') || !self.background.hasClass('guerrillaTutorialBackground')) {
        if (self.isSoldierPlayer()) {
          self.background.addClass('stateTutorialBackground');
        }
        else {
          self.background.addClass('guerrillaTutorialBackground');
        }
      }

      // Change the tooltip styles based on the player's role
      if (Opentip.styles.tutorialActionTips === undefined || Opentip.styles.tutorialTips === undefined) {
        if (self.isSoldierPlayer()) {
          Opentip.styles.tutorialActionTips = {
            extends: "tutorialTips",
            className: "stateTutorialActionTips",
            borderColor: "yellow",
            borderWidth: 1,
            background: [[0, "rgba(91, 103, 119, 0.8)"], [1, "rgba(69, 83, 96, 0.9)"]]
          };

          Opentip.styles.tutorialTips = {
            extends: "dark",
            className: "stateTutorialTips",
            borderColor: "#000",
            borderWidth: 1,
            background: [[0, "rgba(196, 215, 229, 0.95)"], [1, "rgba(153, 168, 179, 0.95)"]],
          };
        }
        else {
          Opentip.styles.tutorialActionTips = {
            extends: "tutorialTips",
            className: "guerrillaTutorialActionTips",
            borderColor: "yellow",
            borderWidth: 1,
            background: [[0, "rgba(103, 96, 77, 0.8)"], [1, "rgba(69, 63, 50, 0.9)"]]
          };

          Opentip.styles.tutorialTips = {
            extends: "dark",
            className: "guerrillaTutorialTips",
            borderColor: "#000",
            borderWidth: 1,
            background: [[0, "rgba(220, 212, 193, 0.9)"], [1, "rgba(210, 197, 163, 0.95)"]],
          };
        }
      }
    };
  };

  return new Tutorial;
});

//----------------------------------------------------------------------------
// Computed CSS Style Copy Functions
// Origin: http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element/6416527#6416527
//----------------------------------------------------------------------------
(function($){
  $.fn.getStyleObject = function(){
    var dom = this.get(0);
    var style;
    var returns = {};
    if(window.getComputedStyle) {
      var camelize = function(a,b) {
        return b.toUpperCase();
      };
      style = window.getComputedStyle(dom, null);
      for(var i = 0, l = style.length; i < l; i++) {
        var prop = style[i];
        var camel = prop.replace(/\-([a-z])/g, camelize);
        var val = style.getPropertyValue(prop);
        returns[camel] = val;
      };
      return returns;
    };
    if(style = dom.currentStyle) {
      for(var prop in style){
        returns[prop] = style[prop];
      };
      return returns;
    };
    return this.css();
  }
})(jQuery);

$.fn.copyCSS = function(source){
  var styles = $(source).getStyleObject();
  this.css(styles);
}

//----------------------------------------------------------------------------
// Script data structure
//
// [ array for each step of the script
//  {el: <JQuery selector> //these elements will be highlighted
//   action: <JQuery selector> //if undefined, a 'click' on el will move to next tutorial step
//                             //if null, no events on el will be used to proceed to next tutorial step
//                             //if defined, a 'click' on these elements will proceed to the next tutorial step
//   tip: {         //a tooltip to be displayed
//    title: <text> //the text to use as a title for this tip
//    content: <text> //the text to use as context for this tip
//    target: <Jquery selector> //which element this tip will point to.
//                              //if undefined, the el will be used
//    stemLength: <number> //how far away the tool tip will be to the element
//    tipJoint: <(top,middle,bottom) (left, center, right)> //which direction to project the tool tip
//   }
//   grouped: <boolean> //if a bounding box should be rendered around el or not
//   callback: <function> //a callback function that gets called at the end of this tutorial step
//  }

//  //a single step can have multiple elements/tips defined.
//  //E.g. First step has two elements defined, second step has one
// [{el:''},
//  {el:''}],
// {el: ''}
// ]
