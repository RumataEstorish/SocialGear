/*global tau, $*/

function DialogsProgress(max) {
	var self = this, progressBar = document.getElementById("circleprogress"), page = document.getElementById('pageCircleProgressBar'), progressBarWidget = null, result = $("#result");

	Object.defineProperty(this, "result", {
		get : function() {
			return result;
		},
	});

	Object.defineProperty(this, "progressBarWidget", {
		get : function() {
			return progressBarWidget;
		},
	});

	page.addEventListener("pagebeforeshow", function() {
		if (tau.support.shape.circle) {
			progressBarWidget = new tau.widget.CircleProgressBar(progressBar, {
				size : "full"
			});
		} else {
			progressBarWidget = new tau.widget.CircleProgressBar(progressBar, {
				size : "large"
			});
		}
		self.progress(0, max);
	});
	page.addEventListener("pagehide", function() {
		if (progressBarWidget) {
			progressBarWidget.destroy();
			progressBarWidget = null;
		}
	});

	if (max > 2) {
		tau.changePage("#pageCircleProgressBar");
	}
}

DialogsProgress.prototype.progress = function(val, max) {

	if (this.progressBarWidget) {
		this.progressBarWidget.value(100 * parseInt(val, 0) / parseInt(max, 0));
		this.result.html(parseInt(this.progressBarWidget.value(), 0) + "%");
	}

	/*
	 * if (Utils.getActivePage() !== 'pageCircleProgressBar') {
	 * tau.changePage("#pageCircleProgressBar"); }
	 */
};