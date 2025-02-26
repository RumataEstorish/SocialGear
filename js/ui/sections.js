/*global $, tau*/
/*jshint unused: false*/

Sections.BACKWARD = 'BACKWARD';
Sections.FORWARD = 'FORWARD';

function Sections(pageName, pageIndicatorId, sectionId, sectionChanged){

	var self = this, pName = pageName[0] === '#' ? pageName : '#' + pageName, indicatorId = pageIndicatorId[0] === '#' ? pageIndicatorId : '#' + pageIndicatorId,
			sId = sectionId[0] === '#' ? sectionId : '#' + sectionId, pageIndicator = null, sectionChanger = null, activeSectionId = 0;
	
	Object.defineProperty(this, 'activeSection', {
		get : function(){
			return $(sId + '.ui-section-active');
		}
	});
	
	Object.defineProperty(this, 'pageIndicator', {
		get : function(){
			return pageIndicator;
		}
	});
	
	Object.defineProperty(this, 'prevSection', {
		get : function(){
			switch(activeSectionId){
			case 0:
				return $(sId + ' section').eq(2);
			case 1: 
				return $(sId + ' section').eq(0);
			case 2: 
				return $(sId + ' section').eq(1);
			}
		}
	});
	
	Object.defineProperty(this, 'nextSection', {
		get : function(){
			switch(activeSectionId){
			case 0:
				return $(sId + ' section').eq(1);
			case 1: 
				return $(sId + ' section').eq(2);
			case 2: 
				return $(sId + ' section').eq(0);
			}
		}
	});
	
	Object.defineProperty(this, 'nextSectionId', {
		get : function(){
			if (activeSectionId === 2){
				return 0;
			}
			return activeSectionId + 1;
		}
	});
	
	Object.defineProperty(this, 'prevSectionId', {
		get : function(){
			if (activeSectionId === 0){
				return 2;
			}
			return activeSectionId - 1;
		}
	});
	
	
	$(pName).on('pagebeforeshow', function(){
		pageIndicator = tau.widget.PageIndicator($(indicatorId)[0], {numberOfPages : 3});
		sectionChanger = new tau.widget.SectionChanger($(sId)[0], { circular : true, orientation: 'horizontal', useBouncingEffect: true});
	});
	
	$(pName).on('pagehide', function(){
		pageIndicator.destroy();
		sectionChanger.destroy();
	});
	
	var sectionChangedInternal = function(evt){
		if (activeSectionId < evt.detail.active || (activeSectionId === 2 && evt.detail.active === 0)){
			sectionChanged({direction : Sections.BACKWARD});
		}
		else{
			sectionChanged({direction : Sections.FORWARD});
		}
		activeSectionId = evt.detail.active;
	};
	
	$(sId).on('sectionchange', function(evt){		
		sectionChangedInternal(evt);
	});
	
	$(document).on("rotarydetent", function(e){
		switch(e.detail.direction){
		case 'CW':
			self.moveForward();
			break;
		case 'CCW':
			self.moveBackward();
			break;
		}
	});
	
	this.moveForward = function(){
		this.pageIndicator.setActive(this.nextSectionId);
		sectionChanged({direction : Sections.FORWARD});
		activeSectionId = this.nextSectionId;
	};
	
	this.moveBackward = function(){
		this.pageIndicator.setActive(this.prevSectionId);
		sectionChanged({direction : Sections.BACKWARD});
		activeSectionId = this.prevSectionId;
	};
}