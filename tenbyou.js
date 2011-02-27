/**
* @fileoverview drop された画像ファイルを点描みたく表示します。
* @description drop された画像データを一時的な canvas 要素に貼りつけてそれ自体は隠す。<br>
* そこからランダムにピクセル情報を拾って描画用の真っ白な canvas の、同じ座標へ、<br>
* 色情報をちょっと加工して出力。それをループさせています。
*/
(function (win, doc, timeout, interval) {

	var el_droparea = null, // ドロップ先要素
		el_tempCanvas = null, // 一時的な canvas 要素。これは画像のピクセル情報を拾うためのもので、これ自体は見せません。
		el_canvas = null, // 描画用の canvas 要素。ここへ画像データ、一時的な canvas 要素を経由して得られたピクセル情報を基に点々を打ちます。
		reader = null; // FileReader オブジェクト

	win.addEventListener('load', init, false);

	/**
	* @function
	* @description 各HTML要素の取得。ドロップ先要素のイベントを登録します。
	*/
	function init () {

		el_droparea = doc.querySelector('#droparea');
		el_tempCanvas = doc.querySelector('#temp-canvas');
		el_canvas = doc.querySelector('#canvas');

		el_droparea.addEventListener(
			'dragover',
			function (e) {
				e.preventDefault();
				el_droparea.className = 'over';
			},
			false
		);

		el_droparea.addEventListener(
			'dragleave',
			function (e) {
				e.preventDefault();
				el_droparea.className = '';
			},
			false
		);

		el_droparea.addEventListener('drop', onDropFile, false);
	}

	/**
	* @function
	* @description ドロップ先要素にファイルがドロップされた際の処理<br>
	* ドロップされたデータが画像であれば続行
	*/
	function onDropFile (e) {

		e.preventDefault();

		var file = null;

		doc.body.removeChild(el_droparea);

		file = e.dataTransfer.files[0];

		if (!/^image/.test(file.type)) {
			return false;
		}

		reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = onReadImage;
	}

	/**
	* @function
	* @description ドロップされた画像をHTML要素に配置。
	*/
	function onReadImage (e) {

		var img = doc.createElement('img');

		img.setAttribute('src', reader.result);

		el_droparea.appendChild(img);

		img.addEventListener('load', onLoadImage, false);
	}

	/**
	* @function
	* @description HTML要素に配置された画像が読み込み完了した時の処理<br>
	* 一時的なcanvas要素の方へ画像を貼り付け。点描表現を開始します。
	*/
	function onLoadImage (e) {

		var img = e.target,
			imgW = parseInt(img.width, 10),
			imgH = parseInt(img.height, 10),
			canvasW = window.innerWidth, // canvas要素は出来るだけウィンドウぴったり、大きく見せようかと。
			canvasH = window.innerHeight, // 同じく
			ctx = null;

		// サイズ調整
		if (imgW > imgH) {
			canvasH = canvasW * (imgH / imgW);
		} else {
			canvasW = canvasH * (imgW / imgH);
		}

		el_tempCanvas.width = canvasW;
		el_tempCanvas.height = canvasH;

		// 一時的なcanvasの方でgetContext.
		// そこへ読み込まれた画像を貼り付けます。
		ctx = el_tempCanvas.getContext('2d');
		ctx.drawImage(img, 0, 0, canvasW, canvasH);

		// 一時的なcanvasのimageDataをもって点描表現の開始
		draw(ctx.getImageData(0, 0, canvasW, canvasH));

		// 一時的なcanvasは隠します
		el_tempCanvas.style.display = 'none';
	}

	/**
	* @function
	* @description 実際の点描表現を行います
	*/
	function draw (imageData) {

		var ctx = null,
			len = imageData.data.length,
			pixels = len / 4,
			arcAmount = 200000,
			intv = null,
			w = null,
			h = null,
			long = null;

		el_canvas.width = w = imageData.width;
		el_canvas.height = h = imageData.height;

		long = Math.max(w, h);

		ctx = el_canvas.getContext('2d');

		// 点を打っていくループ
		intv = interval(function() {

			var drawRate = 40, // 1ループで同時に打点する数。1ループ1個だとのんびりすぎるので。
				maxRadius = 0;

			arcAmount = arcAmount - drawRate;

			// 現在の打点量から、点の大きさを決めています。
			// 最初は大きい点からスタート、とりあえず何か画が出てることは見せて飽きないように配慮。
			// 描画が進んできたら、点を小さくしていってディテールを描いていきます。
			if (arcAmount >= 160000) {
				maxRadius = Math.max(1, long / 50);
			} else if (arcAmount < 160000 && arcAmount >= 120000) {
				maxRadius = Math.max(1, long / 100);
			} else if (arcAmount < 120000 && arcAmount >= 80000) {
				maxRadius = Math.max(1, long / 200);
			} else if (arcAmount < 80000 && arcAmount >= 40000) {
				maxRadius = Math.max(1, long / 400);
			} else if (arcAmount > 0) {
				maxRadius = 1;
			} else {
				clearInterval(intv);
			}

			// 1ループ内での設定個数まで同時打点
			while (drawRate--) {

				var i = Math.floor(Math.random() * pixels), // 一時的なcanvasから拾ってくるピクセル座標をランダムに決めます。
					r = imageData.data[i * 4] + Math.floor(Math.random() * 120) - 60, // 味付けに色情報をちょっといじります。これはRGBの赤
					g = imageData.data[i * 4 + 1] + Math.floor(Math.random() * 120) - 60, // 同じく、これは緑
					b = imageData.data[i * 4 + 2] + Math.floor(Math.random() * 120) - 60, // 青
					x = Math.floor(i % imageData.width), // 打点先の座標
					y = Math.ceil(i / imageData.width),
					radius = Math.floor(Math.random() * maxRadius);

				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI*2, false);
				ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ', 0.2)';
				ctx.fill();
			}
		}, 13, arcAmount);
	}

})(window, document, setTimeout, setInterval);
