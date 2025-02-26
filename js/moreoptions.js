/*global tau*/

function ActionPopup(page) {
	this.page = page;
	
	if (tau.support.shape.circle) {
		this.popup = "#moreoptionsPopupCircle";
	} else {
		this.popup = "#moreoptionsPopup";
	}
}

ActionPopup.prototype.show = function() {
	this.opened = true;
	
	if (tau.support.shape.circle) {
		var page = document.querySelector("#" + this.page), radius = window.innerHeight / 2 * 0.8, elSelector = page.querySelector("#selector");
		this.selector = tau.widget.Selector(elSelector, {
			itemRadius : radius
		});
	}
	tau.openPopup(this.popup);
};

ActionPopup.prototype.close = function() {
	this.opened = false;
	if (tau.support.shape.circle && this.selector) {
		this.selector.destroy();
		this.selector = null;
	}
	tau.closePopup(this.popup);
};