/*
 * Viktor's Quick Export
 * version: 0.1
 * author: @ViktorTabori
 *
 * `ctrl + S` to export the whole graph
 */
if (window.ViktorExport) window.ViktorExport.stop();
window.ViktorExport = (function(){
  	/**
     * Possible formats:
     *  EDN	- full database
     *  JSON
     *  Markdown
     */
    var format = window.ViktorOpts && window.ViktorOpts.exportFormat || 'EDN';
  
  
	var started = false;

	start();

	return {
		started: started,
		start: start,
		stop: stop,
	};

	function start() {
		if (started) return;
		started = !started;

		document.addEventListener('keypress', process, true);
		console.log('** export installed **');
	}

	function stop() {
		if (!started) return;
		started = !started;

		document.removeEventListener('keypress', process, true);
		console.log('** export STOPPED **');
	}

	function process(ev) {
		// we look for ctrl+s keypress
		if (ev.code != "KeyS" || !ev.ctrlKey || ev.altKey || ev.metaKey || ev.shiftKey) return;

		console.log("CTRL + S pressed");
		e.preventDefault();
		e.stopPropagation();

		// actions
		var clicks = [
			{f:function(){return clickNode('.bp3-icon-more', '')}, sleep:10},
			{f:function(){return clickNode('a.bp3-menu-item', 'Export All')}, sleep:10},
			{f:function(){return clickNode('.bp3-dialog .bp3-button', 'Markdown')}, sleep:10},
			{f:function(){return clickNode('.bp3-dialog a.bp3-menu-item', format)}, sleep:10},
			{f:function(){return clickNode('.bp3-dialog .bp3-button', 'Export All')}, sleep:1000},
			{f:function(){return domCheck('.bp3-spinner-animation')}, sleep:500},
			{f:function(){console.log('DONE!!!!'); return true;}, sleep:0}
		];
		var maxtry = 100;

		rotate();

		// rotating through actions
		function rotate() {
			if (clicks.length == 0 || --maxtry < 0) return;

			var sleep = clicks[0].sleep;

			if (clicks[0].f()) {
				clicks.shift();
			}

			setTimeout(rotate, sleep);
		}

		// click a node
		function clickNode(selector, text){
			var element;
			if (text) {
				element = Array.from(document.querySelectorAll(selector)).filter(v=>{ return v.innerText == text });
			} else {
				element = [document.querySelector(selector)].filter(v=>v);
			}
			if (element.length > 0) {
				element[0].click();
				return true;
			}

			return false;
		}

		// check if a node is present
		function domCheck(selector) {
			if (document.querySelector(selector)) {
				return false;
			}
			return true;
		}
	}
})();
