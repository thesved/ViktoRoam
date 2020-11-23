/*
 * Viktor's Roam Native Autoenclose PoC
 * version: 0.3
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: {{[[roam/js]]}}
 *  - create a clode block under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 */
if (window.ViktorAutoenclose && window.ViktorAutoenclose.stop) window.ViktorAutoenclose.stop();
window.ViktorAutoenclose = (function(){
	var started = false;

	start();

	return {
		isStarted: ()=>started,
		start: start,
		stop: stop,
	};

	function start() {
		if (started) return;
		started = !started;

		document.addEventListener('keydown', process);
		console.log('** auto enclose installed **');
	}

	function stop() {
		if (!started) return;
		started = !started;

		document.removeEventListener('keydown', process);
		console.log('** auto enclose STOPPED **');
	}

	async function process(e) {
		// no ` character since now it seems to be supported by Roam
		var autoEnclose = "'\"";
		var autoComplete = "\""; // no autocomplete without selection for ' because of `it's` for example
		var replace = [[/[„“”"]/g, '"'], [/[‘’']/g, "'"]];
		var delKeys = ";Delete;Backspace;";

		// we only modify text within a textarea
		var t = e.target;
		if (t.tagName != 'TEXTAREA') return;

		// replace different quotes
		var key = e.key;
		replace.forEach(function(r){
			key = key.replace(r[0], r[1]);
		});
		// we listen only for autoEnclose characters
		if (autoEnclose.concat(autoComplete).indexOf(key) == -1 && delKeys.indexOf(';'+key+';') == -1) return;

		// save current selection
		var range = {start:t.selectionStart, end:t.selectionEnd, key:key, value:t.value, selection:t.value.substr(t.selectionStart,t.selectionEnd-t.selectionStart)};

		// wait for text change
		await sleep(20);

		// process text
		var ret;
		// selected text is auto enclosed
		if (range.start != range.end && autoEnclose.indexOf(range.key) > -1) {
			ret = {elem:t, value:insert(t.value, range.start+1, range.selection+range.key), start:range.start+1, end:range.start+1+range.selection.length};
		}
		// auto complete when next char is a whitespace
		if (range.start == range.end && autoComplete.indexOf(range.key) > -1 && (range.start == range.value.length || (range.value[range.start]||'').match(/\W/))) {
			ret = {elem:t, value:insert(t.value, range.start+1, range.key), start:range.start+1, end:range.start+1};
		}
		// delete autoenclose characters symetrically
		var direction = range.Key == "Delete"?0:-1;
		if (range.start == range.end && delKeys.indexOf(range.key) > -1 && autoEnclose.indexOf(range.value[range.start+direction]) > -1 && range.value[range.start+direction] == range.value[range.start-(direction+1)]) {
			ret = {elem:t, value:insert(t.value, range.start-1, '', 1), start:range.start-1, end:range.start-1};
		}

		if (ret) {
			// replace quote-like characters
			replace.forEach(function(r){
				ret.value = ret.value.replace(r[0], r[1]);
			});
			await setValue(ret.elem, ret.value, ret.start, ret.end);
		}
	}

	// bypass react setter, set text to textarea
	async function setValue(elem, value, selectStart=0, selectEnd=0) {
		Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set.call(elem,value);
		await sleep(20);
		elem.selectionStart = selectStart;
		elem.selectionEnd = selectEnd;
		await sleep(20);
		elem.dispatchEvent(new Event('input', {bubbles: true, cancelable: true }));
	}

	// insert text into an another at a given position
	function insert(str, index, add, del=0) {
		return str.slice(0, index) + add + str.slice(index + del);
	}

	function sleep(millis) {
	    return new Promise(function(resolve){setTimeout(resolve, millis||20)});
	}
})();
