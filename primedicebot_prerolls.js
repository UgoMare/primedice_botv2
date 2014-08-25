function setBotParams() { params = {
  bet: 0.00000002,	// SET TO YOUR INITIAL START BET AFTER PREROLL
  odds: 49.5,	// winning chance
  type: 0,	// high / low roll (1 = low, 0 = high)
  runs: 100000,	// number of bets to make
  pad_bet: 0.00000000,	// bet to make while pre-rolling
  prerolls: 1,	// NUMBER OF LOSSES BEFORE STARTS BETTING
  on_loss_multi: 2,	// multiply bet on loss (after pre-rolling) (1.134 = 11.34% on LOSS)
  stop_min: 0.00000000,	// stop betting if number drops to/below this number
  stop_max: 0.02000000,	// stop betting if number reaches this number
  all_in_save: false,	// go all-in if bet is higher than balance
  high_low_swap: false,	// invert roll each bet
  // -- don't edit below this point --
  loss_count: 0,
  current_run: 0,
  current_bet: 0,
  current_run_loss: 0,
  capping_loss: false
};
}

var lastmessage = -20,
autobet_speed = -200000,
normalbet_speed = -20000,
id = 0,
timedCount, timer, lastYourBet = 0,
lastAllBet = 0,
lastBigBet = 0,
autobet_halt, first_load = true,
autobet_index = false,
prev_balance = 0,
bet_ids = [];
function bet(bet, odds, type, callback) {
  $.ajax({
    url: '/api/bet.php',
    type: 'post',
    data: {
      'bet': bet,
      'game': odds,
      'type': type == 0 ? 1 : 0,
      'client_seed': $('#client-seed').val()
    },
    dataType: 'json',
    success: function (data) {
      if (data.error) {
        autobet_halt = true;
        return;
      }
      var $seed = $('#client-seed'),
      seed = $seed.val(),
      $parent = $seed.parent(),
      i = seed.indexOf('-'),
      val;
      if (i == -1) {
        seed += '-0000';
        i = seed.indexOf('-');
      }
      val = (parseInt(seed.substr(i + 1)) + 1).toString();
      while (val.length < 4) {
        val = '0' + val;
      }
      seed = seed.substr(0, i) + '-' + val;
      $seed.val(seed);
      $parent.find('.pretty-text').text(seed);
      $('#server-seed').text(data.next_server_seed);
      prev_balance = data.balance;
      $('#balance').val(data.balance);
      $('#balance-value').text(data.balance).stop(true, true).css({
        color: data.result == "1" ? '#0f0' : '#f66'
      }).animate({
        color: '#fff'
      }, 500);

    },
    error: function (jqXHR) {
      autobet_halt = true;
    },
    complete: function (jqXHR) {
      var data;
      try {
        data = $.parseJSON(jqXHR.responseText);
      } catch (e) {
        data = false;
      }
      if (typeof callback === 'function') {
        callback(data);
      }
    }
  });
}
function auto_bet(params) {
  if (bot_enabled === true) {
    if (params.current_run === params.runs) {
      botoff();
      alert("Bot stopped- completed " + params.runs + " runs");
    } else {
      setTimeout(function () {
        var current_balance = parseFloat($('#balance-value').text());
        if (current_balance === 0) {
          autobet_index = false;
          alert("Bot stopped- balance is zero")
          return;
        } else if (params.current_bet > current_balance) {
          if (parmas.all_in_save === true) {
            params.current_bet = current_balance;
          } else {
            botoff();
            alert("Bot stopped- bet is higher than balance");
            return;
          }
        } else if (current_balance < params.stop_min) {
          botoff();
          alert("Bot stopped- balance below " + params.stop_min);
          return;
        } else if (current_balance === params.stop_min) {
          botoff();
          alert("Bot stopped- balance below " + params.stop_min);
          return;
        } else if (current_balance > params.stop_max) {
          botoff();
          alert("Bot stopped- balance reached " + params.stop_min);
          return;
        } else if (current_balance === params.stop_max) {
          botoff();
          alert("Bot stopped- balance reached " + params.stop_min);
          return;
        }
        bet(params.current_bet, params.odds, params.type, function (data) {
          var i, a, j, curbet;
          if (data) {
            params.current_run++;
            autobet_index = params.current_run;
            if (data.result == 0) {
              if (params.capping_loss == true) {
                params.current_bet *= params.on_loss_multi;
              } else {
                if (params.current_run_loss == params.prerolls) {
                  params.capping_loss = true;
                  params.current_run_loss = 1;
                  params.current_bet = params.bet;
                } else {
                  params.current_run_loss += 1;
                }
              }
              params.loss_count += 1;
            } else {
              params.current_bet = 0;
              params.current_run_loss = 1;
              params.capping_loss = false;
              params.loss_count = 1;
            }
            curbet = params.current_bet.toString();
            if (curbet.indexOf('e') > -1) {
              i = parseInt(curbet.substr(0, curbet.indexOf('e')).replace('.', ''));
              a = parseInt(curbet.substr(curbet.indexOf('e') + 2));
              curbet = i.toString();
              for (j = 1; j < a; j++) {
                curbet = '0' + curbet;
              }
              params.current_bet = '0.' + curbet;
            }
            params.current_bet = +('' + params.current_bet).substr(0, ('' +params.current_bet).indexOf('.') + 9);
            if (data.balance < data.current_bet) {
              return;
            }
          }
          if (params.current_run < 10000000) {
            if (params.high_low_swap === true) {
              if (params.type === 1) {
                params.type = 0;
                params.odds = 100 - params.odds
              } else {
                params.type = 1;
                params.odds = 100 - params.odds
              }
            }
            if(params.current_bet < params.pad_bet)
              params.current_bet = params.pad_bet;
              auto_bet(params);
            } else {
              setBotParams();
              params.current_bet = params.pad_bet;
              autobet_index = false;
              auto_bet(params);
              return;
            }
          })
        }, autobet_speed);
      }
    }
    console.clear();
    console.clear(); console.log("Current loss streak: " +params.current_run_loss);
  }
  function addRows($table, rows, autobet_i) {
    var table_selector = $table.selector,
    td_tmpl = '<td class="tabs__table-column tabs__table-cell"',
    $tableod, $tr, top, new_top, count = 0,
    need_placeholder = false,
    trhtml = '';
    if (rows.error) {
      return;
    }
    //	console.log('new rows!');
    $table.stop(true);
    $tableod = $table.clone();
    if ($tableod.find('tr.placeholder').length) {
      need_placeholder = true;
      $tableod.find('tr.placeholder').remove();
      //	console.log(need_placeholder ? 'Has Placeholder' : 'No Placeholder');
    }
    top = parseInt($table.css('top'));
    if (isNaN(top)) top = 0;
      $.each(rows, function (i, data) {
        if (data.error) {
          return;
        }
        if (count == 30 || (!autobet_i && data.bet_id && $.inArray(data.bet_id, bet_ids) !== -1)) return;
          need_placeholder = !need_placeholder;
          count++;
          bet_ids.push(data.bet_id);
          var value = data.winnings.toString(),
          multiplier = data.multiplier.toString();
          if (value.indexOf('.') !== -1) {
            value += '00000000';
          }
          value = value.substr(0, value.indexOf('.') + 9);
          value = value.indexOf('-') != -1 ? value.substr(1) : value;
          value = (data.result == "1" ? '+' : '-') + value;
          if (multiplier.indexOf('.') == -1) {
            multiplier += '.00000';
          } else {
            multiplier += '00000';
            multiplier = multiplier.substr(0, multiplier.indexOf('.') + 6);
          }
          trhtml += '<tr class="tabs__table-row bet-' + data.bet_id + '">' + td_tmpl + '<a class="action-fancybox" href="/modals/bet.html?id=' + data.bet_id + '">' + data.bet_id + '</a>' + (autobet_i ? ' (' + params.loss_count + ') (' + autobet_i + ')' : '') + '</td>' + td_tmpl + '>' + data.username + '</td>' + td_tmpl + '>' + data.elapsed + '</td>' + td_tmpl+ '>' + data.bet + '</td>' + td_tmpl + '>' + multiplier + '</td>' + td_tmpl + '>' + data.game + '</td>' + td_tmpl+ '>' + data.roll + '</td>' + td_tmpl + ' style="color: ' + (data.result == "1" ? 'green' : 'red') + '">' + value+ '</td>' + '</tr>';
        });
        $tableod.prepend(trhtml);
        if (need_placeholder) {
          $tableod.find('tr:first').clone().addClass('placeholder').prependTo($tableod);
          top = -(count * 34) - 34;
          new_top = -34;
        } else {
          top = -(count * 34);
          new_top = 0;
        }
        $tableod.css('top', top);
        $tableod.find('tr:gt(30)').addClass('removing');
        $table.replaceWith($tableod);
        $tableod.stop().animate({
          'top': new_top
        });
        $tableod.find('tr.removing').animate({
          opacity: 0
        }, function () {
          $(this).remove();
        });
        //	console.log($tableod.find('tr:first').is('.placeholder') ? 'Has Placeholder' : 'No Placeholder');
      }
      function updateYourBets() {
        $.ajax({
          url: '/api/get_bets.php',
          data: {
            id: parseInt($('#user-id').text()),
            count: '30',
            bet_id: lastYourBet
          },
          type: 'post',
          dataType: 'json',
          success: function (data) {
            if (!data || data.length === 0) return;
              lastYourBet = data[0].bet_id;
              addRows($('#table-1'), data);
            }
          });
        }
        function updateBigBets(callback) {
          $.ajax({
            url: '/api/get_bets.php',
            data: {
              value: '.5',
              count: '30',
              bet_id: lastBigBet
            },
            type: 'post',
            dataType: 'json',
            success: function (data) {
              if (!data || data.length === 0) return;
                lastBigBet = data[0].bet_id;
                addRows($('#table-3'), data);
              },
              complete: function () {
                if (typeof callback == 'function') callback();
                }
              });
            }
            function updateAllBets(callback, first) {
              if (first) {
                $.ajax({
                  url: '/api/get_bets.php',
                  data: {
                    count: '30',
                    bet_id: lastAllBet
                  },
                  type: 'post',
                  dataType: 'json',
                  success: function (data) {
                    if (!data || data.length === 0) return;
                      lastAllBet = data[0].bet_id;
                      addRows($('#table-2'), data.reverse());
                    },
                    complete: callback
                  });
                  return;
                }
                var did_one = false,
                checker = function () {
                  if (did_one && typeof callback == 'function') callback();
                    did_one = true;
                  };
                  $.ajax({
                    url: '/api/get_bets.php',
                    data: {
                      count: '30',
                      bet_id: lastAllBet,
                      value: '0.1'
                    },
                    type: 'post',
                    dataType: 'json',
                    success: function (data) {
                      if (!data || data.length === 0) return;
                        lastAllBet = data[0].bet_id;
                        addRows($('#table-2'), data.reverse());
                      },
                      complete: checker
                    });
                    $.ajax({
                      url: '/api/get_bets.php',
                      data: {
                        count: '1',
                        bet_id: lastAllBet,
                        less: '0.1'
                      },
                      type: 'post',
                      dataType: 'json',
                      success: function (data) {
                        if (!data || data.length === 0) return;
                          lastAllBet = data[0].bet_id;
                          addRows($('#table-2'), data.reverse());
                        },
                        complete: checker
                      });
                    }
                    function updateBalance(checker) {
                      $.ajax({
                        url: '/api/get_balance.php',
                        dataType: 'json',
                        success: function (data) {
                          $('#balance').val(data.balance);
                          $('#balance-value').text(data.balance);
                        },
                        complete: checker
                      });
                    }
                    function update(callback) {
                      var did_count = 0,
                      checked = function () {
                        did_count++;
                        if (did_count == 4 && typeof callback == 'function') callback();
                        }
                        updateStats(checked);
                        updateAllBets(checked, first_load);
                        updateBigBets(checked);
                        updateBalance(checked);
                        first_load = false;
                      }
                      function updateStats(checked) {
                        $.ajax({
                          url: '/api/stats.php',
                          type: 'get',
                          dataType: 'json',
                          success: function (data) {
                            $('#stats-wagered').text(data.wagered);
                            $('#stats-bets').text(data.bets);
                            $('#stats-bank').text(data.bank);
                          },
                          complete: checked
                        })
                      }
                      function botoff() { bot_enabled = false; }
                      setBotParams();
                      params.current_bet = params.pad_bet;
                      autobet_halt = false;
                      bot_enabled = true;
                      autobet_index = 0;
                      auto_bet(params);
