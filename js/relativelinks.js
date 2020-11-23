/*
 * Viktor's Dynamic Block links
 * version: 0.1
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: { {[[roam/js]]}}
 *  - create a clode block pulled under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - reload roam
 */
if (window.ViktorRelativelinks && window.ViktorRelativelinks.stop) window.ViktorRelativelinks.stop()
window.ViktorRelativelinks = (function(){
	/*
	 * Supported:
	 * `parent` - parent
	 * `child`, `childfirst` `child2`, `childlast` - 1st, 1st, 2nd, last child
	 * `next`, `next2`, `nextlast` - +1, +2, or last sibling after
	 * `prev`, `prev2`, `prevfirst` - -1, -2, or first sibling before
	*/
	var observer,
		started = false,
		lookfor = 'a.rm-alias[href^="block:"]';

	// start date change
	start();

	return {
		start: start,
		stop: stop,
		resolve: resolve,
		isStarted: ()=>started,
		getObserver: ()=>observer
	}

	function start() {
		if (started) return;
		started = true;

		// change current dates
		changeLinks(document.body); 

		// subscribe to changes
		observer = new MutationObserver(mutationsList=>{
			mutationsList.forEach(mutation=>{
				mutation.addedNodes.forEach(added=>changeLinks(added));
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

		observer.disconnect();

		// log
		console.log('stopped looking for dynamic block links');

		return true;
	}

	// resolve clicks on dynamic block links
	function resolve(uid, text) {
		var url = (document.location.href.match(/^.*?\/app\/[^\/]+/)||[''])[0];
		if (!url) return;

		return url+'/page/'+text.toLowerCase().split(',').reduce((id, step)=>{
			// if no match, we don't change the current uid
			var match = /^(parent|child(?:ren)?|next|prev)(-?\d+|first|last)?$/i.exec(step);
			if (!match) return id;

			// query uids based on the current command
			var newId;
			var query;
			if (/parent/i.test(match[1])) {
				// get parent uid
				query = '[:find (pull ?t [:block/uid :block/order]) :in $ ?a :where [?e :block/uid ?a] [?t :block/children ?e] ]';
			} else 
			if (/child/i.test(match[1])) {
				// get children uids
				query = '[:find (pull ?t [:block/uid :block/order]) :in $ ?a :where [?e :block/uid ?a] [?e :block/children ?t] ]';
			} else {
				// get sibling uids
				query = '[:find (pull ?t [:block/uid :block/order]) :in $ ?a :where [?e :block/uid ?a] [?p :block/children ?e] [?p :block/children ?t] ]';
			}

			// query and sort
			var results = roamAlphaAPI.q(query, id).flat();
			if (results.length == 0) return id; // no results no change in uid
			results.sort((a,b)=>a.order-b.order);

			// index of current element, if not found, then -1
			var current = results.findIndex(e=>e.uid == id);

			// resolve newId
			switch (match[2]) {
				case 'first':
					newId = results.shift().uid;
					break;
				case 'last':
					newId = results.pop().uid;
					break;
				default:
					var direction = {prev:-1,next:1}[match[1]] || 1; // we look forward or backward
					var offset = current + direction * (1*match[2] || 1); // parse offset, default 1 step
					offset = offset < 0 ? 0 : (offset >= results.length ? results.length - 1 : offset); // min 0, max 
					newId = results[offset].uid;
			}

			return newId || id;
		}, uid);
	}

	// modify dynamic block links
	function changeLinks(dom) {
		// looking for nodes
		if (!dom || !dom.querySelectorAll) return;

		// check dynamic block link aliases
		var links = Array.from(dom.querySelectorAll(lookfor));

		links.forEach(link=>{
			// only set listener and dataset once
			if (link.dataset.dynamic) return;

			// set dataset and listener
			link.dataset.dynamic = link.href.replace(/^block:/i,'');
			link.addEventListener('click', (e)=>{
				// try to resolve the dynamic block
				var block = resolve(link.closest('.roam-block').id.substr(-9), link.dataset.dynamic);

				// prevent link opening up
				e.preventDefault();
				e.stopPropagation();

				// navigate if link is valid
				if (block) {
					// if success then change href
					document.location = block;
				}
			}, {capture: true});
		});

		if (links.length) {
			window._links = links;
		}
	}
})();
