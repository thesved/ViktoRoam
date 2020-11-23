/*
 * Viktor's Roam Mobile Long tap to Exluce Filters and Right click on bullets + pages + title
 * version: 0.3
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: { {[[roam/js]]}}
 *  - create a clode block under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - long tap a filter and it gets excluded
 *  - long tap on bullets to simulate right click
 *  - long tap on titles, page references to open in sidebar
 */
if (window.ViktorMobileLongTap) window.ViktorMobileLongTap.stop();
window.ViktorMobileLongTap = /*window.ViktorMobileLongTap ||*/ (function(){
	// max wait for second tap in ms
	var doLog = true,
		minWaitTime = 200, // turn taps into long taps after this amount of milliseconds
		clickBlockTime = 800, // clicks get cancelled after long taps within this timeframe in milliseconds
		animTime = 400,
		highlightColor = 'rgba(255, 165, 0, 0.1)', // background color of selected block
		deduplicateSidebar = true,
		added = false,
		last = new Date(),
		popupWidth = 230+25, // popup width in pixel plus margin
		tapStatus = {status: false, target: null, latestLongTap: null}, // status of long tap tracking
		css = document.createElement('style');
	css.id = 'CSSViktorMobileLongTap';
	css.innerHTML = `
		:root {
		  --animate-delay: 0ms;
		  --animate-duration: ${animTime}ms;
		  --animation-overshoot: 1.02;
		}

		.animate__animated {
		  -webkit-animation-duration: 1s;
		  animation-duration: 1s;
		  -webkit-animation-duration: var(--animate-duration);
		  animation-duration: var(--animate-duration);
		  -webkit-animation-fill-mode: both;
		  animation-fill-mode: both;
		}

		@-webkit-keyframes pulseReverse {
		  from, to {
		    -webkit-transform: scale3d(1, 1, 1);
		    transform: scale3d(1, 1, 1);
		  }

		  50% {
		    -webkit-transform: scale3d(0.95, 0.95, 0.95);
		    transform: scale3d(0.95, 0.95, 0.95);
		  }
		  
		  90% {
		    -webkit-transform: scale3d(var(--animation-overshoot), var(--animation-overshoot), var(--animation-overshoot));
		    transform: scale3d(var(--animation-overshoot), var(--animation-overshoot), var(--animation-overshoot));
		  }
		}
		@keyframes pulseReverse {
		  from, to {
		    -webkit-transform: scale3d(1, 1, 1);
		    transform: scale3d(1, 1, 1);
		  }

		  50% {
		    -webkit-transform: scale3d(0.95, 0.95, 0.95);
		    transform: scale3d(0.95, 0.95, 0.95);
		  }
		  
		  90% {
		    -webkit-transform: scale3d(var(--animation-overshoot), var(--animation-overshoot), var(--animation-overshoot));
		    transform: scale3d(var(--animation-overshoot), var(--animation-overshoot), var(--animation-overshoot));
		  }
		}
		.animate__pulseReverse {
		  -webkit-animation-name: pulseReverse;
		  animation-name: pulseReverse;
		  -webkit-animation-timing-function: ease-in-out;
		  animation-timing-function: ease-in-out;
		}

		/* fix popover menu and left sidebar menu order */
		.bp3-transition-container { 
		  z-index:9999!important; 
		}
		`;

	// start the plugin
	start();

	// return public attributes
	return {
		isAdded: ()=>added,
		start: start,
		stop: stop,
	};

	// install and run the plugin
	function start() {
		if (added) return;
		added = true;

		'click mousedown mouseup contextmenu touchstart touchmove touchend selectionchange'.split(' ').forEach(type=>{
			document.addEventListener(type, process, {passive: false, capture: true});
		});

		document.head.appendChild(css);

		if (doLog) console.log('** long tap installed **');
	}

	// stop the plugin
	function stop() {
		if (!added) return;
		added = false;

		'click mousedown mouseup contextmenu touchstart touchmove touchend selectionchange'.split(' ').forEach(type=>{
			document.removeEventListener(type, process, {passive: false, capture: true});
		});

		if (css.parentNode) css.parentNode.removeChild(css);

		if (doLog) console.log('** long tap STOPPED **');
	}

	// process touch and click events
	function process(e) {
		//console.log(e.type,(new Date().getTime())-last.getTime(),e.simulated,e.target);
		last = new Date();
		var target = e.target;
		var location = {
			x: e.clientX || e.targetTouches&&e.targetTouches.length&&e.targetTouches[0].clientX, 
			y: e.clientY || e.targetTouches&&e.targetTouches.length&&e.targetTouches[0].clientY,
		};

		// fn - this will be called on long taps
		var action;

		// stop long taps on touchmove and touchend
		if (e.type == 'touchmove' || e.type == 'touchend') {
			//console.log('** abort touch **');
			tapStatus.status = false;
			return;
		}
		// prevent clicks after long taps
		if (e.type.match(/click|contextmenu|mouse|selectionchange/i)) {
			//console.log('  ',tapStatus.latestLongTap&&((new Date()).getTime() - tapStatus.latestLongTap.getTime()),clickBlockTime,!e.simulated,tapStatus.latestLongTap && ((new Date()).getTime() - tapStatus.latestLongTap.getTime()) < clickBlockTime && !e.simulated, e.type=='selectionchange'&&e);
			if (tapStatus.latestLongTap && ((new Date()).getTime() - tapStatus.latestLongTap.getTime()) < clickBlockTime && !e.simulated) {
				//console.log('  ','!! CLICK prevented');
				e.preventDefault();
				e.stopPropagation();
				if (window.getSelection().rangeCount) window.getSelection().removeAllRanges();
			}
			tapStatus.status = false;
			return;
		}

		// filter, search, and page reference long tap to shift click
		try {	
			if (target.classList && (
					target.classList.contains('rm-search-title') // search result
					|| target.closest('.bp3-popover-content button.bp3-button') && target.parentNode.firstChild.nodeName.match(/button/i) // filter
					|| target.closest('.rm-page-ref') // page reference
					) 
				|| target.closest('.rm-pages-title-text') // all pages search
				) {
				action = function(){
					var sidebar;

					// deduplicate sidebar: close already open sidebar elements and open a new one as first child, except filter tags
					if (deduplicateSidebar && (!target.classList || !target.classList.contains('bp3-button'))) {
						sidebar = document.getElementById('roam-right-sidebar-content') && document.getElementById('roam-right-sidebar-content').children || [];
						var close = Array.from(sidebar).filter(function(el){ var title=el.querySelector('h1'); return title && title.textContent == target.textContent });
						close.forEach(function(el){
							simulateClick(el.querySelector('.bp3-icon-cross'), ['mousedown', 'click', 'mouseup'], true);
						});
					}

					// simulate shift click
					simulateClick(target, ['mousedown', 'click', 'mouseup'], true, {shiftKey:true});

					// animation for page reference click: page links in all pages page or blocks
					var _animate = sidebar && (target.closest('.rm-pages-title-col') || target.closest('.flex-h-box'));
					//console.log('animate',_animate);
					if (_animate) {
						animateCSS(_animate, ['pulseReverse']);
					}
				}
			}
		} catch(_) { }

		// right click on bullets, titles, page references
		if (!action)
			try {
				// bullet right click
				if (target.closest('.controls')) {
					target = target.closest('.controls');

					// set callback function for long tap
					action = function() {
						// calculate where the popup should open on the left side if there is not enough space
						var bound = target.getBoundingClientRect();
						var left = (bound.left + bound.width) < popupWidth ? 0 : bound.left + bound.width - popupWidth;

						// simulate right click
						simulateClick(target, ['contextmenu'], false, {clientX:left, clientY:(bound.top+bound.height/2)});

						// calculate how much we have to move the block
						var transform = left == 0 ? popupWidth - bound.left - bound.width : 0;
						// find block
						var el = target.closest('.roam-block-container');
						if (!el) return;

						// move block to the right
						el.style.webkitTransform = 'translate3d('+transform+'px, 0, 0)';
						el.style.transform = 'translate3d('+transform+'px, 0, 0)';
						// change background color
						el.style.backgroundColor = highlightColor;

						// look for overlay close
						(new MutationObserver(function(mutations, obs){
							mutations.forEach(function(mutation){
								if (mutation.attributeName == 'class' && !document.body.classList.contains('bp3-overlay-open')) {
									// remove transform
									el.style.webkitTransform = '';
									el.style.transform = '';

									// remove coloring
									el.style.backgroundColor = '';

									// remove observer
									obs.disconnect();
								}
							});
						})).observe(document.body, { attributes: true });
					}				
				}

				// title right click
				if (target.closest('.rm-title-display')) {
					var bound = target.getBoundingClientRect();

					action = function() {
						simulateClick(target, ['contextmenu'], false, {clientX:location.x, clientY:location.y});
					}
				}
			} catch(_) { }

		if (!action) {
			//console.log('NO action **');
			return;
		}

		// 
		if (e.type == 'touchstart') {
			//console.log('start waiting **');
			tapStatus.status=true;
			tapStatus.target=e.target;
			setTimeout(function(){
				if (tapStatus.status) {
					//console.log('LONG TAP **',(new Date()).getTime() - last.getTime());
					last = new Date();

					tapStatus.status = false;
					tapStatus.latestLongTap = new Date();

					// run action
					simulateTouch(target, ['touchend']);
					action();
				} else {
					//console.log('NO longer tapping **');
				}
			}, minWaitTime);
		}
	}

	// mouse click emulation
    function simulateClick(element, events, leftButton, opts) {
    	setTimeout(function(){
			events.forEach(function(type){
				var _event = new MouseEvent(type, {
			        view: window,
			        bubbles: true,
			        cancelable: true,
			        buttons: leftButton?1:2,
			        ...opts,
			    });
			    _event.simulated = true;
				element.dispatchEvent(_event);
			});
		}, 0);
	}

	// mouse click emulation
    function simulateTouch(element, events, opts) {
    	setTimeout(function(){
			events.forEach(function(type){
				var _event = new TouchEvent(type, {
			        view: window,
			        bubbles: true,
			        cancelable: true,
			        ...opts,
			    });
			    _event.simulated = true;
				element.dispatchEvent(_event);
			});
		}, 0);
	}

	function animateCSS(node, animations, prefix) {
		var prefix = prefix || 'animate__';

		// We create a Promise and return it
		return new Promise((resolve, reject) => {
			animations = animations.map(function(animation){return `${prefix}${animation}`});
			animations.push(`${prefix}animated`);

			node.classList.add(...animations);

			// When the animation ends, we clean the classes and resolve the Promise
			function handleAnimationEnd() {
				node.classList.remove(...animations);
				node.removeEventListener('animationend', handleAnimationEnd);

				resolve('Animation ended');
			}

			node.addEventListener('animationend', handleAnimationEnd);
		});
	}
})();
