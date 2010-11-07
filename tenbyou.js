(function ($) {

$('#button').bind('click', function () {

	loadImage(src)

	function loadImage (src) {
		$(document.body)
			.prepend($('<img>')
				.attr('src', src)
				.css('display', 'none')
				.bind('load', onloadImage)
		);
	}

	function onloadImage (e) {
		var image = $(e.target);
		var w = image.outerWidth();
		var h = image.outerHeight();
		var pallet = $('#pallet')
			.attr({
				width: w,
				height: h
			});
		var ctx = pallet.get(0).getContext('2d');
		ctx.drawImage(image.get(0), 0, 0);
		draw(ctx.getImageData(0, 0, w, h));
	}

	function draw (imageData) {
		var canvas = $('#canvas')
			.attr({
				width: imageData.width,
				height: imageData.height
			});
		var ctx = canvas.get(0).getContext('2d');
		var len = imageData.data.length;
		var pixels = len / 4;

		var arcAmount = 200000;

		var update = setInterval(function() {

			var drawRate = 40;
			var maxRadius = 0;

			arcAmount = arcAmount - drawRate;
			if (arcAmount >= 160000) {
				maxRadius = 16;
			} else if (arcAmount < 160000 && arcAmount >= 120000) {
				maxRadius = 8;
			} else if (arcAmount < 120000 && arcAmount >= 80000) {
				maxRadius = 4;
			} else if (arcAmount < 80000 && arcAmount >= 40000) {
				maxRadius = 2;
			} else if (arcAmount > 0) {
				maxRadius = 1;
			} else {
				clearInterval(update);
			}

			while (drawRate--) {
				var i = Math.floor(Math.random() * pixels);
				var r = imageData.data[i * 4] + Math.floor(Math.random() * 120) - 60;
				var g = imageData.data[i * 4 + 1] + Math.floor(Math.random() * 120) - 60;
				var b = imageData.data[i * 4 + 2] + Math.floor(Math.random() * 120) - 60;
				var x = Math.floor(i % imageData.width);
				var y = Math.ceil(i / imageData.width);
				var radius = Math.floor(Math.random() * maxRadius);

				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI*2, false);
				ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ', 0.2)';
				ctx.fill();
			}
		}, 33, arcAmount);
	}

});

})(jQuery);
