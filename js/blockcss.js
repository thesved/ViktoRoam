/*
 * Viktor's Block CSS
 * version: 0.1
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: { {[[roam/js]]}}
 *  - create a clode block pulled under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - reload roam
 *  - use #block:hide and it adds `hide` class to the block
 */
if (window.ViktorBlockcss && window.ViktorBlockcss.stop) window.ViktorBlockcss.stop();
window.ViktorBlockcss = (function(){
	var observer,
		started = false,
		lookfor = '[data-tag^="block:"]';

	// start date change
	start();

	return {
		start: start,
		stop: stop,
		isStarted: ()=>started,
		getObserver: ()=>observer
	}

	function start() {
		if (started) return;
		started = true;

		// process current tags
		changeLinks(document.body); 

		// subscribe to changes
		observer = new MutationObserver(mutationsList=>{
			mutationsList.forEach(mutation=>{
				mutation.addedNodes.forEach(m=>changeLinks(m));
				mutation.removedNodes.forEach(m=>changeLinks(m, true));
			});

		});
		observer.observe(document.body, { childList: true, subtree: true });

		// log
		console.log('looking for dynamic block links');

		return true;
	}

	function stop() {
		if (!started) return;
		started = false;

		// stop observing
		observer.disconnect();

		// remove all tags
		changeLinks(document.body, true); 

		// log
		console.log('stopped looking for dynamic block links');

		return true;
	}

	// modify dynamic block links
	function changeLinks(dom, removed) {
		// looking for nodes
		if (!dom || !dom.querySelectorAll) return;

		// check dynamic block link aliases
		var links = Array.from(dom.querySelectorAll(lookfor));

		links.forEach(link=>{
			// get closest roam container
			if (!link.closest) return;
			var block = link.closest('.roam-block-container') || document.activeElement && document.activeElement.closest('.roam-block-container');
			if (!block || !block.classList) return;

			// add class(es) to block
			var classList = link.textContent.replace(/^#?block:/i,'').split(' ');
			classList.forEach(cl=>{
				console.log('blocklist',removed,cl);
				if (removed) block.classList.remove(cl);
				else block.classList.add(cl);
			});
		});
	}
})();
