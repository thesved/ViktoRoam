# ViktoRoam
Better UX for Roam Research

See: https://twitter.com/ViktorTabori/status/1330887482871869444

# How to install
1. Go to [[roam/js]] page
2. Copy this text to a block: `{{[[roam/js]]}}`
3. Hit `enter` then `tab`
4. Create a code block by using the forward slash menu: `/code block`
5. Click out from the block then copy the code from below to inside the code block (the code block has a grey number 1, click right to it on the white part)
6. enable running the script by clicking: `Yes, I know what I am doing`

```javascript
/*
 * Viktor's Roam Plugin Loader
 * version: 0.1
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: {{[[roam/js]]}}
 *  - create a clode block under it
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 * 
 * DISABLE a script: 
 *  1) change `true` to `false` in the load variable
 *     eg. 'gallery': false
 *  2) reload Roam 
 *      OR disable and enable the {{[[roam/js]]}} block
 */

// settings
window.ViktorOpts = {
	dateformat: 'YYYY.MM.DD EEE',	// see for details: https://github.com/thesved/ViktoRoam/blob/master/js/dateformat.js
	nameMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	nameMonthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	nameDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
	nameDaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
	exportFormat: 'JSON',		// EDN | JSON | Markdown
	fuckitlineTag: 'fuckitline',	// tag a block with this, eg #fuckitline
	fuckitlineName: 'fuck it line'	// name above the fuckitline
};

// plugins handling
(()=>{
	var load = {
		'gallery': true,	// zoom in on images 
		'longtap': true,	// long tap for right clicking on touch devices
		'dateformatter': true,	// display dates differently than `January 1st, 2020` format
		'relativelinks': true,	// have relative links, like [next block](block:next)
		'export': true,		// `ctrl + S` for quickly exporting the whole database
		'blockcss': true,	// create css for blocks with tags, eg #block:hide
		'autoenclose': true,	// automatically enclose " and ' characters
		'fuckitline': true,	// use #fuckitline on a block and it highlights the first 3 children
	};

	var defaultrepo = 'https://js.limitlessroam.com/js/';

	// add alpha channel
	if (typeof alphaChannel == 'object') Object.keys(alphaChannel).forEach(a=>{ load[a]=true });

	// handling script loading and stopping
	Object.keys(load).forEach(k=>{
		var moduleName = 'Viktor'+k.replace(/^\w/, c => c.toUpperCase()); // eg. ViktorGallery

		// remove script if exists
		var script = document.getElementById(moduleName);
		if (script) 
			script.remove();

		// if script is set to false
		if (!load[k]) {
			// stop from running
			try {
				if (window[moduleName] && typeof window[moduleName].stop === 'function') window[moduleName].stop();
			} catch(_) {}

			return;
		}

		// add it
		var extension = document.createElement("script");
		extension.src = typeof alphaChannel == 'object' && typeof alphaChannel[k] != 'undefined' ? alphaChannel[k] : defaultrepo+k+'.js';	// add url
		extension.src = extension.src + (extension.src.indexOf('?') > -1 ? '&' : '?') + 'cb='+Date.now();	// add cache buster
		extension.id = moduleName;
		extension.async = false;
		extension.type = "text/javascript";
		document.head.appendChild(extension);
	});
	
})();
```

# Common Errors
1. code block is NOT indented under the `{{[[roam/js]]}}` block, check: it is good when you see a triangle (▼) next to the `{{[[roam/js]]}}`, indicating you can collapse it
2. you paste the code OUTSIDE the code block, check: it is good when on the left side of the code there are gray line numbers
