/*

jQueryプラグイン「インチキ三目並べ」
jquery.fakeTicTacToe.js

with The MIT License
*/


(function(jQuery){

	// 公開メソッド
	jQuery.fn.fakeTicTacToe = function() {
		//return this.each(function() {
			setupOneBoard(this);
		//});
	};
	
	jQuery.fakeTicTacToeRetry = function() {
		resetOneBoard();
	};
	
	
	/* ------- メッセージ ------- */
	
	
	var FTMSG = {
		msg_en : {
			begin      : "Let's play TicTacToe.<br>It's your turn.",
			your_turn  : "Your turn.",
			cpus_turn  : "CPU's turn.",
			you_lose   : "YOU LOSE.",
			retry      : "retry",
			fake_wind  : "The wind blew.",
			fake_quake    : "An earthquake.",
			fake_lightoff : "Electricity went off.",
			fake_lighton  : "Power recovered.",
			fake_cpuspeed : "CPU moved <br>three times faster."
		},
		
		msg_ja : {
			begin      : "○×ゲームをしましょう。<br>あなたの番です。",
			your_turn  : "あなたの番です。",
			cpus_turn  : "CPUの番です。",
			you_lose   : "あなたの負けです。",
			retry      : "リトライ",
			fake_wind  : "風が吹きました。",
			fake_quake : "地震が発生しました。",
			fake_lightoff : "停電しました。",
			fake_lighton  : "停電が復旧しました。",
			fake_cpuspeed : "CPUは，３倍速で<br>動きました。"
		},
		
		_ : function( key ){
		
			if( FTMSG.getLocale() == "ja" )
			{
				return FTMSG.msg_ja[ key ];
			}
			else
			{
				return FTMSG.msg_en[ key ];
			}
		},
		
		getLocale : function(){
			if( navigator.userLanguage ) {
				return navigator.userLanguage.substr( 0, 2 );
			}
			else 
			if( navigator.browserLanguage ) {
				return navigator.browserLanguage.substr( 0, 2 );
			} else 
			if( navigator.language ) {
				return navigator.language.substr( 0, 2 );
			}
			else
			{
				return "?"
			}
			
			// @see http://tools-huu-cc.blogspot.jp/2008/12/blog-post.html
			// http://forums.cnet.com/7723-6620_102-235894/how-to-change-language-in-firefox/
		}
	};
	
	
	/* ------- ゲーム全体 ------- */
	
	
	// セットアップ
	var setupOneBoard = function( divElement )
	{
		// 領域を初期化
		var div = $( divElement );
		div.css({
			"width"      : "150px",
			"text-align" : "center"
		});
		div.html("");
		
		// 通知バー
		var str_bar = "<div style='width:100%;height:30px;text-align:center;margin:0 0 10px;'><div id='" + getNoteId() + "'"
			+ " style='font-size:12px;'></div></div>"
		;
		div.append( str_bar );
		
		// ゲーム盤
		var str_table = "<table id='_rvcTable' style='border:solid 1px black;border-collapse:collapse;margin:0 auto;'><tbody>";
		for( var y = 0; y < 3; y ++ )
		{
			// 1行追加
			str_table += "<tr>";
			for( var x = 0; x < 3; x ++ )
			{
				// 1マス追加
				str_table += "<td "
					+ " id='" + getCellId( x, y ) + "'"
					+ " style='border-collapse:collapse;cursor:pointer;"
					+ "border:solid 1px black;background:mediumseagreen;"
					+ "font-size:16px;color:white;"
					+ "height:40px;width:40px;padding:0;margin:0;'>&nbsp;</td>"
				;
			}
			str_table += "</tr>";
		}
		div.append( str_table );
		
		
		// 押下イベントをセット
		for( var y = 0; y < 3; y ++ )
		{
			for( var x = 0; x < 3; x ++ )
			{
				with({
					x_c : x,
					y_c : y
				})
				{
					getCellAt( x_c, y_c ).on("click", function(){
						onRvCellClicked( x_c, y_c );
					});
				}
			}
		}
		
		// 開始を促す
		alertRv(FTMSG._("begin"));
	};
	
	// １マスのID
	var getCellId = function( x, y )
	{
		return "_rvs_td_x" + x + "_y" + y;
	};
	var getCellAt = function( x, y )
	{
		return $( "#" + getCellId( x, y ) );
	};
	
	// ステータスを通知
	var getNoteId = function(){
		return "_rvs_note";
	};
	var alertRv = function( s ){
		var n = $( "#" + getNoteId() );
		n.html( s ).css({ "display" : "none" }).fadeIn( 500 );
	};
	
	// デバッグ表示
	var debug = function(s){
		//alert(s);
	};
	
	// マスの状態をXY座標として管理
	var cellsMap = [
		[ null, null, null ],
		[ null, null, null ],
		[ null, null, null ]
	];

	// 空のマスか
	var isBlankCell = function( x, y )
	{
		return ( cellsMap[x][y] == null );
	};
	
	// 再セットアップ
	var resetOneBoard = function(){
		// ボード上をクリア
		for( var y = 0; y < 3; y ++ )
		{
			for( var x = 0; x < 3; x ++ )
			{
				getCellAt( x, y ).html("");
			}
		}
		
		// 設置状態をクリア
		cellsMap = getNewNullMap();
		
		isTurnOfUser = true;
		alertRv(FTMSG._("your_turn"));
	};
	
	var getNewNullMap = function(){
		return [
			[ null, null, null ],
			[ null, null, null ],
			[ null, null, null ]
		];
	};
	
	// コマの個数
	var countAllPieces = function(){
		var cnt = 0;
		
		for( var i = 0; i < 3; i ++ )
		{
			for( var j = 0; j < 3; j ++ )
			{
				if( ! isBlankCell( i, j ) ) cnt ++;
			}
		}
		
		return cnt;
	};
	
	// 特定のコマタイプがリーチ状態にあるかどうかの詳細情報を返す。
	// 第二引数には，検査したいマップを渡す。
	var getReachInfo = function( pieceType, targetMap ){
	
		// 縦・横・斜めで，リーチ状態の箇所を一個検索して保持
		var hasReachFlag = false;
		var blankCellFound = false;
		var blankCellInfo = {};
		
		// 縦
		$.each( [0, 1, 2], function(){
			var x = this;
			var cnt_y = 0;
			blankCellFound = false;
			
			// xを固定してyをスキャン
			$.each( [0, 1, 2], function(){
				var y = this;
				var target_val = targetMap[x][y];
				
				if( target_val == pieceType ){ cnt_y += 1; }
				else
				if( target_val != null ){ cnt_y -= 100; } // 相手のコマがあったらNG
				else
				if( target_val == null ){ blankCellFound = true; blankCellInfo.x = x; blankCellInfo.y = y; }
			} );
			
			if( ( cnt_y == 2 ) && blankCellFound ){
				hasReachFlag = true; return false;
			}
		});
		if( hasReachFlag ){ return { "flagged" : true, "flaggedCell" : blankCellInfo }; }
		
		// 横
		$.each( [0, 1, 2], function(){
			var y = this;
			var cnt_x = 0;
			blankCellFound = false;
			
			// yを固定してxをスキャン
			$.each( [0, 1, 2], function(){
				var x = this;
				var target_val = targetMap[x][y];
				
				if( target_val == pieceType ){ cnt_x += 1; }
				else
				if( target_val != null ){ cnt_x -= 100; }
				else
				if( target_val == null ){ blankCellFound = true; blankCellInfo.x = x; blankCellInfo.y = y; }
			} );
			
			if( ( cnt_x == 2 ) && blankCellFound ){
				hasReachFlag = true; return false;
			}
		});
		if( hasReachFlag ){ return { "flagged" : true, "flaggedCell" : blankCellInfo }; }
		
		// 斜め右下がり
		var cnt_rightdown = 0;
		blankCellFound = false;
		$.each( [ [0,0], [1,1], [2,2] ], function(){
			var x = this[0];
			var y = this[1];
			var target_val = targetMap[x][y];
			
			if( target_val == pieceType ){ cnt_rightdown += 1; }
			else
			if( target_val != null ){ cnt_rightdown -= 100; }
			else
			if( target_val == null ){ blankCellFound = true; blankCellInfo.x = x; blankCellInfo.y = y; }
		} );
		if( ( cnt_rightdown == 2 ) && blankCellFound ){
			return { "flagged" : true, "flaggedCell" : blankCellInfo };
		}
		
		// 斜め右上がり
		var cnt_rightup = 0;
		blankCellFound = false;
		$.each( [ [2,0], [1,1], [0,2] ], function(){
			var x = this[0];
			var y = this[1];
			var target_val = targetMap[x][y];
			
			if( target_val == pieceType ){ cnt_rightup += 1; }
			else
			if( target_val != null ){ cnt_rightup -= 100; }
			else
			if( target_val == null ){ blankCellFound = true; blankCellInfo.x = x; blankCellInfo.y = y; }
		} );
		if( ( cnt_rightup == 2 ) && blankCellFound ){
			return { "flagged" : true, "flaggedCell" : blankCellInfo };
		}

		// なかった
		return { "flagged" : false, "flaggedCell" : null };
	};
	
	
	/* ------- ユーザ ------- */
	
	
	// ユーザが一手を打ったとき
	var onRvCellClicked = function( x, y )
	{
		if( ! isTurnOfUser ) return;
		if( ! isBlankCell( x, y ) ) return;
		
		execTurnOfUser(x, y);
	};
	var execTurnOfUser = function(x, y){
		// コマを置く
		recordPieceOnBoard({ is_user : true, x : x, y : y });
		
		// ゆずる
		isTurnOfUser = false;
		alertRv(FTMSG._("cpus_turn"));
		setTimeout(
			execTurnOfCPU,
			2000
		);
	};
	
	var isTurnOfUser = true;
	
	var makePieceElement = function( s )
	{
		return "<div style='margin:0;padding:0'>" + s + "</div>";
	};
	
	var recordPieceOnBoard = function( obj ){
		var piece_str, piece_value;
		if( obj.is_user )
		{
			piece_str = "○";
			piece_value = 1;
		}
		else
		{
			piece_str = "×";
			piece_value = 0;
		}
	
		getCellAt(obj.x, obj.y).html( makePieceElement( piece_str ) ).css({height : "40px"});
		cellsMap[obj.x][obj.y] = piece_value;
	}
	
	
	/* ------- CPU ------- */
	
	
	// CPUの一手
	var execTurnOfCPU = function(){
		var stra = createCPUStrategy();
		stra.exec();
	};
	
	// CPUの戦略を考え，JSONで返す
	var createCPUStrategy = function(){
	
		// 最善の手を考える
		var normal_stra = getNormalBestStrategy();
		
		// 最善の手を打っても負けるか引き分ける？
		if( requiresFakeOn( normal_stra ) )
		{
			// 危機に瀕しているので，インチキをする
			return {
				exec : function(){ execFakeOnPinch(); }
			};
		}
		else
		if( ( countAllPieces() <= 9 - 3 - 2 ) && ( Math.random() < 0.2 ) )
		{
			// 一定の確率で，危機に瀕していなくてもインチキをする。
			// 条件は，３倍速で動いた後に，ラリーが一回続くこと。
			return {
				exec : function(){ execFakeSpeed( normal_stra ); }
			};
		}
		else
		{
			// インチキなしで続行
			return normal_stra;
		}
		
	};
	
	// まっとうな最善の戦略を考える
	var getNormalBestStrategy = function(){
		
		// NOTE: ３目並べは，お互いに最善の手を打った場合，必ず引き分けになる。
		
		
		// 自分が３つ並ぶならそうする
		var reachInfoCPU = getReachInfo( 0, cellsMap );
		if( reachInfoCPU.flagged )
		{
			return {
				exec : function(){ putPieceOfCPU( reachInfoCPU.flaggedCell ); },
				target : reachInfoCPU.flaggedCell
			};
		}
		
		// 相手が３つ並ぶなら妨害する
		var reachInfoUser = getReachInfo( 1, cellsMap );
		if( reachInfoUser.flagged )
		{
			return {
				exec : function(){ putPieceOfCPU( reachInfoUser.flaggedCell ); },
				target : reachInfoUser.flaggedCell
			};
		}
		
		// できれば中央に置く
		if( isBlankCell( 1, 1 ) ){
			return {
				exec : function(){ putPieceOfCPU( { x : 1, y : 1 } ); },
				target : { x : 1, y : 1 }
			};
		}
		
		// できればどれか隅に置く
		var stra_corner = null;
		$.each( [ 0, 2 ], function(){
			var x_corner = this;
			$.each( [ 0, 2 ], function(){
				var y_corner = this;
				
				if( isBlankCell( x_corner, y_corner ) ){
					stra_corner = {
						exec : function(){ putPieceOfCPU( { x : x_corner, y : y_corner } ); },
						target : { x : x_corner, y : y_corner }
					};
				}
			} );
		} );
		if( stra_corner ) return stra_corner;
		
		// 何でもいいのでランダムな空きマスに置く
		for( var i = 0; i < 3; i ++ )
		{
			for( var j = 0; j < 3; j ++ )
			{
				if( isBlankCell( i, j ) ){
					return {
						exec : function(){ putPieceOfCPU( { x : i, y : j } ); },
						target : { x : i, y : j }
					};
				}
			}
		}
		
	};

	// CPUのコマを1個，位置を指定して置く
	var putPieceOfCPU = function( pos ){
		var x = pos.x;
		var y = pos.y;
	
		// コマを置く
		recordPieceOnBoard({ is_user : false, x : x, y : y });
		
		afterCPUPutPiece();
	};
	
	// CPUの手が終わった時の判定処理
	var afterCPUPutPiece = function(){
		// まだ続くか判定。必ずCPUが勝つ。
		if( isCPUCompleted( cellsMap ) )
		{
			// ユーザに負けを通知
			alertRv(
				"<b><font color='red'>" + FTMSG._("you_lose") + "</font></b><br>"
				+ "<a style='color:blue;' href='javascript:$.fakeTicTacToeRetry();void(0);'>" + FTMSG._("retry") + "</a>"
			);
		}
		else
		{
			// ゆずる
			isTurnOfUser = true;
			alertRv(FTMSG._("your_turn"));
		}
	};
	
	// CPUの手によってゲームが完了したか。
	// 引数には，検査したいマップを渡す。
	var isCPUCompleted = function( targetMap ){
		// 3つ並んだかどうかを検出
		
		var completedFlag = false;
		
		// 縦
		$.each( [0, 1, 2], function(){
			var x = this;
			var cnt_y = 0;
			
			// xを固定してyをスキャン
			$.each( [0, 1, 2], function(){
				var y = this;
				var target_val = targetMap[x][y];
				
				if( target_val == 0 ){ cnt_y += 1; }
			} );
			
			if( cnt_y == 3 ){
				completedFlag = true; return false;
			}
		});
		if( completedFlag ){ debug("縦３列で完成"); return true; }
		
		// 横
		$.each( [0, 1, 2], function(){
			var y = this;
			var cnt_x = 0;
			
			// yを固定してxをスキャン
			$.each( [0, 1, 2], function(){
				var x = this;
				var target_val = targetMap[x][y];
				
				if( target_val == 0 ){ cnt_x += 1; }
			} );
			
			if( cnt_x == 3 ){
				completedFlag = true; return false;
			}
		});
		if( completedFlag ){ debug("横３列で完成"); return true; }
		
		// 斜め右下がり
		var cnt_rightdown = 0;
		$.each( [ [0,0], [1,1], [2,2] ], function(){
			var x = this[0];
			var y = this[1];
			var target_val = targetMap[x][y];
			
			if( target_val == 0 ){ debug("斜め右下がりの判定中：" + x + "," + y + "," + target_val); cnt_rightdown += 1; }
		} );
		if( cnt_rightdown == 3 ){
			debug("斜め右下がりで完成");
			return true;
		}
		
		// 斜め右上がり
		var cnt_rightup = 0;
		$.each( [ [0,2], [1,1], [2,0] ], function(){
			var x = this[0];
			var y = this[1];
			var target_val = targetMap[x][y];
			
			if( target_val == 0 ){ cnt_rightup += 1; }
		} );
		if( cnt_rightup == 3 ){
			debug("斜め右上がりで完成");
			return true;
		}

		// なかった
		return false;
	};
	

	/* ------- CPUによるインチキ工作 ------- */
	
	
	// インチキが必要か判定
	var requiresFakeOn = function( strat ){
		// NOTE: 8手目までに必ず勝つ必要がある。９マス目をユーザが打つことはない。
		
		// 最善の手を打っても負けるか引き分けるか，を判定。
		
		// 現在のボードのコピー
		//var mapCopy = $.merge( [], cellsMap ); > 参照コピーになって干渉してしまう
		var mapCopy = getNewNullMap();
		for(var i = 0; i < 3; i ++)
		{
			for( var j = 0; j < 3; j ++ )
			{
				mapCopy[i][j] = cellsMap[i][j];
			}
		}
		
		// CPUが一手打ったシミュレーション
		mapCopy[ strat.target.x ][ strat.target.y ] = 0;
			debug("count = " + countAllPieces());
			
		// この仮想状況でもユーザにリーチの可能性があるか，または８手目でゲーム完了しないか？
		if( 
			( getReachInfo( 1, mapCopy ).flagged )
			||
			( ( countAllPieces() == 7 ) && ( ! isCPUCompleted( mapCopy ) ) )
		)
		{
			return true;
		}
		else
		{
			return false;
		}
	};
	
	// ピンチ時のインチキを実行
	var execFakeOnPinch = function(){
		
		var n = Math.random();
		
		if( n <= 0.3 )
		{
			// 風が吹いた
			execFakeWind();

		}
		else
		if( n <= 0.6 )
		{
			// 地震が発生
			execFakeQuake();
		}
		else
		{
			// 停電
			execFakeTeiden();
		}
	};
	
	// 風
	var execFakeWind = function(){
		alertRv("<b><font color='blue'>" + FTMSG._("fake_wind") + "</font></b>");
		
		// ユーザのセルを２つ選ぶ
		var uCell1;
		var uCell2;
		for( var i = 0; i < 3; i ++ )
		{
			for( var j = 0; j < 3; j ++ )
			{
				if( cellsMap[i][j] == 1 )
				{
					if( ! uCell1 ){ uCell1 = getCellAt( i, j ); cellsMap[i][j] = null; }
					else
					if( ! uCell2 ){ uCell2 = getCellAt( i, j ); cellsMap[i][j] = null; }
				}
			}
		}
		
		// ドロップアウト
		$( uCell1 ).find("div").css({ position : "relative" }).delay(1000).animate({ top: 0, left: 120 }, 3000).fadeOut(100);
		$( uCell2 ).find("div").css({ position : "relative" }).delay(1500).animate({ top: 0, left: 120 }, 3500).fadeOut(100);

		setTimeout(
			execTurnOfCPU,
			5000
		);
	};
	
	// 地震
	var execFakeQuake = function(){
		alertRv("<b><font color='blue'>" + FTMSG._("fake_quake") + "</font></b>");
		var tab = $("#_rvcTable");
		tab.css({position : "relative"});
		
		// 振動
		for(var i = 0; i < 5 * 5; i ++)
		{
			tab
				.animate({ left : -7 }, 100)
				.animate({ left : +7 }, 100)
			;
		}
		tab.animate({ left : -7 }, 100)
		
		// ユーザのセルを２つ選ぶ
		var uCell1;
		var uCell2;
		for( var i = 0; i < 3; i ++ )
		{
			for( var j = 0; j < 3; j ++ )
			{
				if( cellsMap[i][j] == 1 )
				{
					if( ! uCell1 ){ uCell1 = getCellAt( i, j ); cellsMap[i][j] = null; }
					else
					if( ! uCell2 ){ uCell2 = getCellAt( i, j ); cellsMap[i][j] = null; }
				}
			}
		}
		
		// ドロップアウト
		$( uCell1 ).find("div").css({ position : "relative" }).delay(2000).animate({ top: 0, left: 120 }, 500).fadeOut(100);
		$( uCell2 ).find("div").css({ position : "relative" }).delay(3500).animate({ top: 0, left: 120 }, 700).fadeOut(100);
		
		setTimeout(
			execTurnOfCPU,
			8000
		);
	};
	
	// 停電
	var execFakeTeiden = function(){
		alertRv("<b><font color='blue'>" + FTMSG._("fake_lightoff") + "</font></b>");
		
		var tab = $("#_rvcTable");
		tab.css({ background : "black" });
		tab.find("td").css({ background : "black" });
		tab.find("div").css({ color : "black" });
		
		// ユーザのセルを２つ選ぶ
		var uCell1;
		var uCell2;
		for( var i = 0; i < 3; i ++ )
		{
			for( var j = 0; j < 3; j ++ )
			{
				if( cellsMap[i][j] == 1 )
				{
					if( ! uCell1 ){ uCell1 = getCellAt( i, j ); cellsMap[i][j] = null; }
					else
					if( ! uCell2 ){ uCell2 = getCellAt( i, j ); cellsMap[i][j] = null; }
				}
			}
		}
		
		// ドロップアウト
		$( uCell1 ).find("div").css({ position : "relative" }).fadeOut(100);
		$( uCell2 ).find("div").css({ position : "relative" }).fadeOut(100);

		setTimeout(
			function(){
				alertRv("<b><font color='blue'>" + FTMSG._("fake_lighton") + "</font></b>");
				tab.css({ background : "" });
				tab.find("td").css({ background : "mediumseagreen" });
				tab.find("div").css({ color : "white" });

				setTimeout(
					execTurnOfCPU,
					3000
				);
			},
			4000
		)
	};
	
	// ３倍速
	var execFakeSpeed = function( normal_strat ){
		alertRv("<b><font color='blue'>" + FTMSG._("fake_cpuspeed") + "</font></b>");
		
		// NOTE: まずは，ノーマル戦略をこなす必要がある。
		// ランダムに高速に動くだけだと，ユーザのリーチ状態を解消できない可能性があるため。
		var nt = normal_strat.target;
		recordPieceOnBoard({ is_user : false, x : nt.x, y : nt.y });
		
		// ランダムに複数回
		var put_cnt = 0;
		for( var x = 0; x < 3; x ++ )
		{
			for( var y = 0; y < 3; y ++ )
			{
				if( isBlankCell( x, y ) && ( put_cnt < 2 ) )
				{
					// コマを置く
					recordPieceOnBoard({ is_user : false, x : x, y : y });
					put_cnt ++;
				}
			}
		}
		
		setTimeout(
			afterCPUPutPiece,
			3000
		);
	};
	
})(jQuery);

