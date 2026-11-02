/**
 * Module that registers the notification box and handles messages
 */
var Notifications = {
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		// Create the notifications box
		elem = $('<div>').attr({
			id: 'notifications',
			className: 'notifications'
		});
		// Create the transparency gradient
		$('<div>').attr('id', 'notifyGradient').appendTo(elem);
		
		elem.appendTo('div#wrapper');
	},
	
	options: {}, // Nothing for now
	
	elem: null,
	
	notifyQueue: {},
	
	// Allow notification to the player
	notify: function(module, text, noQueue) {
		if(typeof text == 'undefined') return;
		if(text.slice(-1) != ".") text += ".";
		if(module != null && Engine.activeModule != module) {
			if(!noQueue) {
				if(typeof this.notifyQueue[module] == 'undefined') {
					this.notifyQueue[module] = [];
				}
				this.notifyQueue[module].push(text);
			}
		} else {
			Notifications.printMessage(text);
		}
		Engine.saveGame();
	},
	
	clearHidden: function() {
	
		// To fix some memory usage issues, we clear notifications that have been hidden.
		
		// We use position().top here, because we know that the parent will be the same, so the position will be the same.
		var bottom = $('#notifyGradient').position().top + $('#notifyGradient').outerHeight(true);
		
		$('.notification').each(function() {
		
			if($(this).position().top > bottom){
				$(this).remove();
			}
		
		});
		
	},
	
			printMessage: function(t) {
		var lower = (t || '').toLowerCase();
		var extraClass = '';
		if (/fire|burning|roaring|warm|light|flame|ember/.test(lower)) {
			extraClass = ' notif-fire';
		} else if (/cold|freezing|chill|shiver|frost/.test(lower)) {
			extraClass = ' notif-cold';
		} else if (/wood|forest|trees|gather/.test(lower)) {
			extraClass = ' notif-wood';
		} else if (/stranger|wanderer|collapsed|stumbles|traveler|guest/.test(lower)) {
			extraClass = ' notif-stranger';
		} else if (/beast|attack|danger|dead|blood|ruined|sickness|plague|thief/.test(lower)) {
			extraClass = ' notif-danger';
		}

		var text = $('<div>').addClass('notification' + extraClass).css('opacity', '0').text(t).prependTo('div#notifications');
		text.animate({opacity: 1}, 500, 'linear', function() {
			Notifications.clearHidden();
		});
	},
	
	printQueue: function(module) {
		if(typeof this.notifyQueue[module] != 'undefined') {
			while(this.notifyQueue[module].length > 0) {
				Notifications.printMessage(this.notifyQueue[module].shift());
			}
		}
	}
};
