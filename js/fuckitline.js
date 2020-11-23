/*
 * Viktor's Roam FuckItLine POC
 * version: 0.2
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: { {[[roam/js]]}}
 *  - create a clode block pulled under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - reload roam
 *
 * demo: https://twitter.com/ViktorTabori/status/1298717150958346241
 */
if (window.ViktorFuckitline && window.ViktorFuckitline.stop) window.ViktorFuckitline.stop();
window.ViktorFuckitline = (function(){
	var tagName = window.ViktorOpts && window.ViktorOpts.fuckitlineTag || 'fuckitline', // changes for #fuckitline
		lineName = window.ViktorOpts && window.ViktorOpts.fuckitlineName || 'fuck it line', // the name of the line
		lookfor = `[data-tag="${tagName}"]`, // transform blocks containing this
		doLog = true, // log to console
		started = false, // status
		observer,
		css = document.createElement('style');
	css.id = 'CSSViktorFuckItLine';
	css.innerHTML = `
		.${tagName} > .flex-v-box > div:nth-child(n+4) {
		    opacity:0.3;
		}
		.${tagName} > .flex-v-box > div:nth-child(4):before {
		    content: "${lineName}";
		    font-size:80%;
		    border-bottom: 1px solid red;
		    margin-left: 24px;
		}`;

	// start fuckit transform
	start();

	return {
		start: start,
		stop: stop,
		started: started
	}

	function start() {
		if (started) return;
		started = true;

		// install css
		document.head.appendChild(css);
		// look for fuckit lines
		FUCKIT(document); 

		// subscribe to changes
		observer = new MutationObserver(function(mutationsList) {
			for(var mutation of mutationsList) {
				mutation.addedNodes.forEach(added=>{
					FUCKIT(added);
				});
				mutation.removedNodes.forEach(removed=>{
					FUCKIT(removed, true);
				});
		    }
		});
		observer.observe(document, { childList: true, subtree: true });

		// log
		if (doLog) console.log(`looking for mutations for #${tagName}`);

		return true;
	}

	function stop() {
		if (!started) return;
		started = false;

		// disconnect observer
		observer.disconnect();
		// remove css
		if (css.parentNode) css.parentNode.removeChild(css);
		// clean up css classes
		Array.from(document.querySelectorAll(`.${tagName}`)).forEach(el=>el.classList.remove(tagName));
		// log
		if (doLog) console.log(`stopped looking for mutations for #${tagName}`);

		return true;
	}

	function FUCKIT(dom, removed) {
		if (!dom || !dom.querySelectorAll) return;
		
		var fucks = Array.from(dom.querySelectorAll(lookfor));
		fucks.forEach(mutation=>{
			var elem = mutation.closest && mutation.closest('.roam-block-container') || document.activeElement && document.activeElement.closest('.roam-block-container');
			if (elem && elem.classList) {
				if (removed) elem.classList.remove(tagName);
				else elem.classList.add(tagName);
			}
		});

		if (doLog && fucks.length) console.log('fuckitline '+(removed?'removed':'added')+':',fucks);
	}
})();
