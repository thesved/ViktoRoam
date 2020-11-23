/*
 * Viktor's Roam gallery PoC v0.3
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: {{[[roam/js]]}}
 *  - create a clode block under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - reload Roam
 *  - click on images
 *  - edit image url on mobile: click top right corner of image
 */
if (window.ViktorGallery && window.ViktorGallery.stop) window.ViktorGallery.stop();
window.ViktorGallery = (function(){
 	var started = false;

 	start();

	return {
		isStarted:()=>started,
		start: start,
		stop: stop,
	};

	function start() {
		if (started) return;
		started = !started;

		// listen
		'click touchstart touchmove touchend'.split(' ').forEach(type=>{
			console.log('gallery looking for',type);
			document.addEventListener(type, process, true);
		});

		// inject photoswipe
		addFile('script','src','https://raw.githubusercontent.com/thesved/ViktoRoam/master/js/photoswipe.4.1.3-Viktor.Tabori.js');
		addFile('script','src','https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe-ui-default.min.js');
		addFile('link', 'href', 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe.css', {rel:'stylesheet'});
		addFile('link', 'href', 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/default-skin/default-skin.css', {rel:'stylesheet'});

		// pswp modal initiate
		if (!document.querySelector('.pswp')) {
			var div = document.createElement('div');
			div.innerHTML = '<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true"> <div class="pswp__bg"></div> <div class="pswp__scroll-wrap"> <div class="pswp__container"> <div class="pswp__item"></div> <div class="pswp__item"></div> <div class="pswp__item"></div> </div> <div class="pswp__ui pswp__ui--hidden"> <div class="pswp__top-bar"> <div class="pswp__counter"></div> <div class="pswp__preloader"> <div class="pswp__preloader__icn"> <div class="pswp__preloader__cut"> <div class="pswp__preloader__donut"></div> </div> </div> </div> </div> <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap"> <div class="pswp__share-tooltip"></div> </div> <div class="pswp__caption"> <div class="pswp__caption__center"></div> </div> </div> </div> </div>';
			document.body.appendChild(div);
		}

		// log
		console.log('Galler plugin loaded & listening');

		return true;
	}

	function stop() {
		if (!started) return;
		started = !started;

		// stop listening
		'click touchstart touchmove touchend'.split(' ').forEach(type=>{
			document.removeEventListener(type, process, true);
		});

		// log
		console.log('Galler plugin stopped');

		return true;
	}

	function process(e) {
		var zoom = 3; // level of zoom on svg images
		var target = e.target;
		var path = e.path;
		window.domURL = self.URL || self.webkitURL || self;

		// if PhotoSwipe is not present
		if (typeof PhotoSwipe == 'undefined' || typeof PhotoSwipeUI_Default == 'undefined') return;

		// handle touch moving
		if (e.type == 'touchstart') {
			PhotoSwipe.target = target;
			return;
		}
		if (e.type == 'touchmove') {
			delete PhotoSwipe.target;
			return;
		}
		if (e.type == 'touchend' && !PhotoSwipe.target) return;

		// parse svg
		if (!path) {
			path = [];
			for (var node = target; node && node != document.body; node = node.parentNode) {
				path.push(node);
			}
		}
		var svg = (path.filter(elem=>elem.nodeName&&elem.nodeName.match(/^svg$/i)) || [undefined])[0];
			svg = path.filter(elem=>elem.classList&&elem.classList.contains('rm-mermaid')).length && svg || undefined;
		if (svg) {
			target = svg;
		}

		// only for images and SVGs
		if (!(target.nodeName == 'IMG' && target.classList.contains('rm-inline-img') || svg)) return;

		// 44x44px top right corner: edit, won't trigger gallery on mobile
		var rect = target.getBoundingClientRect();
		var x = e.pageX - rect.left;
		var y = e.pageY - rect.top;
		if (window.innerWidth<500 && x>(rect.width-44) && y<44) return; // we don't fire for top right corner for mobile

		// prevent click, so editing is not initiated
		e.preventDefault();
		e.stopPropagation();

		// init gallery
		window.pswp = window.pswp || document.querySelector('.pswp');
		var items = Array.from(document.querySelectorAll('img.rm-inline-img, .rm-mermaid svg')).map(function(v){
			var ret = {};
			// svg
			if (v.nodeName.match(/^svg$/i)) {
				v.style.backgroundColor = '#eee';
				//ret.src = 'data:image/svg+xml;base64,'+window.btoa(unescape(encodeURIComponent(v.outerHTML)));
				//ret.src = svgToTinyDataUri(v.outerHTML); // credit: @tigt_, https://github.com/tigt/mini-svg-data-uri
				//ret.html = v.outerHTML;
				//ret.src = domURL.createObjectURL(new Blob([v.outerHTML.replace(/<br>/g,'<br/>')], {type:"image/svg+xml;charset=utf-8"}));
				ret.svg = v.outerHTML;
				ret.src = 'svg';
				ret.w = v.viewBox.baseVal.width*zoom;
				ret.h = v.viewBox.baseVal.height*zoom;
			} else { // image
				ret.src = v.src;
				ret.w = v.naturalWidth;
				ret.h = v.naturalHeight;
			}
			ret.msrc = ret.src;
			ret.dom = v;
			return ret;
		});
		var current = items.findIndex(function(v){return v.dom==target});
		var option = {
			showAnimationDuration: 0,
		    history: false,
		    index: current,
		    getThumbBoundsFn: function(index) {
		    	try {
			        var pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
			            rect = items[index].dom.getBoundingClientRect(); 
			        return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
			    } catch(_) {

			    }
		    }
		};
		var gallery = new PhotoSwipe( pswp, PhotoSwipeUI_Default, items, option);
		setTimeout(function(){
			gallery.init();
			gallery.listen('close', function() {
				items.forEach(function(e){
					if (e.src && e.src.match(/^blob:/i)) {
						domURL.revokeObjectURL(e.src); // cleanup of svg blob URLs
					}
				});
	        });
		}, 0);
	}


	// inject code to head
	function addFile(type,srcName,src,opt){
		if (Array.from(document.head.getElementsByTagName(type)).filter(s=>s[srcName]==src).length) {
			console.log('already loaded', src);
			return;
		}
		var file = document.createElement(type);
		file[srcName] = src;
		file.async = false;
		if (typeof opt == 'object') {
			for (var i in opt) {
				file[i] = opt[i];
			}
		}
		document.head.appendChild(file);
		console.log('added', src);
		return true;
	}
})();
