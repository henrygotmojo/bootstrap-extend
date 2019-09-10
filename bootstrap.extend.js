$(function(){


/*----------------------+
| AUTO AJAX-ERROR ALERT |
+-----------------------+

[Usage]
I show error modal dialog whenever there is server error
===> body[data-ajax-error] = {modal*|alert}
===> simply die() in server-script and error message will auto-show in modal
===> default open dialog when ajax-error
===> applicable to whole site

[Example]
<body data-ajax-error="{modal|~empty~}"> ... </body>
*/

$(document).ajaxError(function(evt, jqXHR, ajaxSettings, thrownError){
	if ( $('body').is('[data-ajax-error]') ) {
		var mode = $('body').attr('data-ajax-error').length ? $('body').attr('data-ajax-error') : 'modal';
		// show message in modal, or...
		if ( mode == 'modal' ) {
			var errMsg = '<h3 class="mt-0" title="'+ajaxSettings.url+'">Error</h3><pre>'+jqXHR.responseText+'</pre>';
			// show message in already opened modal, or...
			var visibleModal = $('.modal:visible .modal-body');
			if ( $(visibleModal).length ) {
				var errAlert = $('#bsx-error-alert');
				// create new alert box (when necessary)
				if ( !$(errAlert).length ) {
					errAlert = $('<div id="bsx-error-alert" class="alert alert-danger" role="alert"></div>');
					$(errAlert).prependTo(visibleModal).hide();
				}
				// show alert box in modal
				$(errAlert)
					.html(errMsg)
					.filter(':visible').hide().fadeIn().end()
					.filter(':hidden').slideDown().end()
					.off('click')
					.on('click', function(){ $(errAlert).slideUp(); });
			// create new modal window and show message
			} else {
				var errModal = $('#bsx-error-modal');
				// create hidden dialog (when necessary)
				if ( !$(errModal).length ) {
					errModal = $('<div id="bsx-error-modal" class="modal" tabindex="-1" role="dialog" data-nocache><div class="modal-dialog"><div class="modal-content bg-danger text-white"><div class="modal-body"></div></div></div></div>');
					$(errModal).appendTo('body');
				}
				// show message in modal
				$(errModal).find('.modal-body').html(errMsg).end().modal('show');
			}
		// show message in alert
		} else {
			alert('[ERROR]\n'+ajaxSettings.url+'\n'+jqXHR.responseText);
		}
	}
});




/*-------------+
| MODAL REMOTE |
+--------------+

[Usage]
Auto-load remote content into modal

[Example]
<a href="foo.html" data-toggle="modal" data-target="#my-modal">...</div>
<button data-href="bar.html" data-toggle="modal" data-target="#my-modal">...</button>
*/

$(document).on('click', '[href][data-target][data-toggle=modal],[data-href][data-target][data-toggle=modal]', function(evt){
	evt.preventDefault();
	var $btn = $(this);
	var $modal = $( $btn.attr('data-target') );
	// validation
	if ( !$modal.length ) {
		console.log('[ERROR] Target modal not found ('+$btn.attr('data-target')+')');
		return false;
	} else if ( !$modal.find('.modal-dialog').length ) {
		console.log('[ERROR] Target modal has no <DIV.modal-dialog> element ('+$btn.attr('data-target')+')');
	}
	// create essential modal structure (when necessary)
	if ( !$modal.find('.modal-content').length ) {
		$modal.find('.modal-dialog').append('<div class="modal-content"></div>');
	}
	// clear modal content first (when necessary)
	$modal
		.find('.modal-body').html('<p>&nbsp;</p>').end()
		.find('.modal-title').addClass('text-muted').html('<i class="fa fa-spinner fa-pulse"></i> Loading...').end()
		.find('.modal-footer .btn:not([data-dismiss=modal])').remove();
	// load content remotely
	$modal.find('.modal-content').load( $btn.attr( $btn.is('[href]') ? 'href' : 'data-href' ) );
});




/*--------------------------------------+
| DATA-TOGGLE : AJAX-LOAD / AJAX-SUBMIT |
+---------------------------------------+

[Usage]
I allow ajax-load/ajax-submit content to specific element by defining data attributes
===> data-target = ~selector~
===> data-toggle = {ajax-load|ajax-submit}
===> data-toggle-mode = {replace*|prepend|append|before|after}
===> data-toggle-loading = {progress*|spinner|spinner-large|overlay|none}
===> data-toggle-transition = {slide*|fade|none}
===> data-toggle-callback = ~function|function-name~
===> data-toggle-pushstate

I use jquery-blockui plugin (if available)
===> when ajax-load or ajax-submit

[Example]
<!-- ajax load -->
<a href="/url/to/go" class="btn btn-default" data-toggle="ajax-load" data-target="#element"> ... </a>
<!-- ajax submit -->
<form method="post" action="/url/to/go" data-toggle="ajax-submit" data-target="#element"> ... </form>
*/

$(document)
	// remote load
	.on('click', '[data-toggle=ajax-load]', function(evt){
		evt.preventDefault();
		var btn = this;
		$(document).trigger('ajaxLoad.bsx', btn);
	})
	// remote submit
	.on('submit', '[data-toggle=ajax-submit]', function(evt){
		evt.preventDefault();
		// BUG : when pass to custom event
		// ===> element becomes BUTTON (instead of FORM)
		// ===> use closest() as dirty fix
		var f = $(this).closest('form');
		$(document).trigger('ajaxSubmit.bsx', f);
	})
	// remote load/submit
	.on('ajaxLoad.bsx ajaxSubmit.bsx', function(evt, triggerElement){
		// confirmation
		if ( $(triggerElement).is('[data-confirm]') ) {
			var msg = $(triggerElement).attr('data-confirm').length ? $(triggerElement).attr('data-confirm') : 'Are you sure?';
			if ( !confirm(msg) ) return false;
		}
		// options
		var targetSelector   = $(triggerElement).attr('data-target');
		var toggleMode       = $(triggerElement).is('[data-toggle-mode]')       ? $(triggerElement).attr('data-toggle-mode') : 'replace';
		var toggleTransition = $(triggerElement).is('[data-toggle-transition]') ? $(triggerElement).attr('data-toggle-transition') : 'slide';
		var toggleCallback   = $(triggerElement).is('[data-toggle-callback]')   ? $(triggerElement).attr('data-toggle-callback') : '';
		var toggleLoading    = $(triggerElement).is('[data-toggle-loading]')    ? $(triggerElement).attr('data-toggle-loading') : 'progress';
		var togglePushState  = $(triggerElement).is('[data-toggle-pushstate]')  ? true : false;
		// apply block-ui when ajax load (if any)
		var configBlockUI;
		if ( $.fn.block ) {
			// default loading style (progress)
			configBlockUI = {
				'message' : false,
				'css' : {
					'backgroundColor' : 'none',
					'border' : 'none'
				},
				'fadeIn' : 0,
				'showOverlay' : true
			};
			// loading style : none
			if ( toggleLoading == 'none' ) {
				configBlockUI['overlayCSS'] = { 'background-color' : 'white', 'opacity' : 0 };
			// loading style : spinner
			} else if ( toggleLoading == 'spinner' || toggleLoading == 'spinner-large' ) {
				configBlockUI['message'] = ( toggleLoading == 'spinner-large' ) ? '<i class="fa fa-spin fa-spinner fa-4x text-muted"></i>' : '<i class="fa fa-spin fa-spinner text-muted"></i>';
				configBlockUI['overlayCSS'] = { 'background-color'  : 'gray', 'opacity' : .1 };
			// loading style : overlay
			} else if ( toggleLoading == 'overlay' ) {
				configBlockUI['overlayCSS'] = { 'background-color'  : 'gray', 'opacity' : .1 };
			// loading style : progress (default)
			} else {
				configBlockUI['overlayCSS'] = {
					'-webkit-animation' : 'progress-bar-stripes 2s linear infinite',
					'animation'         : 'progress-bar-stripes 2s linear infinite',
					'background-color'  : '#bbb',
					'background-image'  : '-webkit-linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent)',
					'background-image'  : 'linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent)',
					'background-size'   : '40px 40px',
				};
			}
		}
		// callback can be either function or event name
		// ===> trigger custom event so that {this} scope is available in callback function
		var toggleCallback = $(triggerElement).is('[data-toggle-callback]') ? $(triggerElement).attr('data-toggle-callback') : '';
		var toggleCallbackFunc = function(){};
		if ( toggleCallback.length ) {
			eval('toggleCallbackFunc = '+toggleCallback+';');
		}
		// when callback event was fired
		// ===> run the callback function
		// ===> there is no [this] variable available in callback function, because the original trigger element was already been replaced...
		$(document).on(evt.type+'Callback.bsx', toggleCallbackFunc);
		// check target
		if ( !targetSelector ) {
			console.log('[Error] '+evt.type+'.'+evt.namespace+' - attribute [data-target] was not specified');
		} else if ( !$(targetSelector).length ) {
			console.log('[Error] '+evt.type+'.'+evt.namespace+' - target not found ('+targetSelector+')');
		}
		// normal redirect or submit when target element was not properly specified
		if ( !targetSelector || !$(targetSelector).length ) {
			$(triggerElement).removeAttr('data-toggle');
			if ( evt.type == 'ajaxSubmit' ) {
				$(triggerElement).submit();
			} else {
				document.location.href = $(triggerElement).is('[href]') ? $(triggerElement).attr('href') : $(triggerElement).attr('data-href');
			}
		// proceed...
		} else {
			var targetElement = $(targetSelector);
			var url;
			if ( $(triggerElement).is('form') ) {
				url = $(triggerElement).attr('action');
			} else if ( $(triggerElement).is('[type=button]') ) {
				url = $(triggerElement).is('[href]') ? $(triggerElement).attr('href') : $(triggerElement).attr('data-href');
			} else if ( $(triggerElement).is('a') ) {
				url = $(triggerElement).attr('href');
			} else {
				console.log('[Error] '+evt.type+'.'+evt.namespace+' - type of trigger element not support');
			}
			var param = $(triggerElement).is('form') ? $(triggerElement).serialize() : {};
			// block
			if ( $(triggerElement).is('form') ) {
				if ( configBlockUI ) {
					$(triggerElement).block( configBlockUI );
				}
				$(triggerElement).find('[type=submit]').attr('disabled', true);
			} else {
				$(triggerElement).attr('disabled', true);
			}
			if ( configBlockUI ) {
				$(targetElement).block( configBlockUI );
			}
			// load result remotely
			$.ajax({
				'url' : url,
				'data' : param,
				'cache' : false,
				'method' : $(triggerElement).is('form[method]') ? $(triggerElement).attr('method') : 'get',
				'success' : function(data, textStatus, jqXHR){
					var newElement;
					// wrap by something if response text is not html
					if ( !$(data).length ) {
						data = '<div>'+data+'</div>';
					}
					// determine position of new element
					if ( toggleMode == 'prepend' ) {
						newElement = $(data).prependTo(targetElement);
					} else if ( toggleMode == 'append' ) {
						newElement = $(data).appendTo(targetElement);
					} else if ( toggleMode == 'before' ) {
						newElement = $(data).insertBefore(targetElement);
					} else {
						newElement = $(data).insertAfter(targetElement);
					}
					// show new element with effect
					// ===> callback after new element shown
					if ( toggleTransition == 'fade' ) {
						$(newElement).hide().fadeIn('normal', function(){
							$(document).trigger(evt.type+'Callback.bsx').off(evt.type+'Callback.bsx');
						});
					} else if ( toggleTransition == 'slide' ) {
						$(newElement).hide().slideDown('normal', function(){
							$(document).trigger(evt.type+'Callback.bsx').off(evt.type+'Callback.bsx');
						});
					} else {
						$(newElement).hide().show();
						$(document).trigger(evt.type+'Callback.bsx').off(evt.type+'Callback.bsx');
					}
					// hide current element (when necessary)
					if ( toggleMode == 'replace' ) {
						if ( toggleTransition == 'slide' ) {
							$(targetElement).slideUp('normal', function(){
								$(targetElement).remove();
							});
						} else {
							$(targetElement).hide().remove();
						}
					}
					// push state (when necessary)
					if ( history.pushState && togglePushState ) {
						history.pushState({
							'pushState.bsx' : {
								'targetSelector'   : targetSelector,
								'toggleMode'       : toggleMode,
								'toggleTransition' : toggleTransition,
								'toggleCallback'   : toggleCallback,
								'toggleLoading'    : toggleLoading
							}
						}, '', url);
					}
				},
				'complete' : function(){
					// unblock trigger element
					if ( $(triggerElement).is('form') ) {
						if ( configBlockUI ) $(triggerElement).unblock();
						$(triggerElement).find('[type=submit]').attr('disabled', false);
					} else {
						$(triggerElement).attr('disabled', false);
					}
					// unblock old element
					if ( configBlockUI ) $(targetElement).unblock();
				}
			});
		}
	});


// listen popstate event
// ===> manipulate page by pushstate object created by ajax-load/ajax-submit
$(window).on('popstate', function(evt){
/*
	// ========== UNDER CONSTRUCTION ==========
	// state data available
	// ===> update the page with state data
	if ( evt.originalEvent.state !== null && evt.originalEvent.state.hasOwnProperty('pushState.bsx') ) {
		console.log('UNDER CONSTRUCTION', evt.originalEvent.state['pushState.bsx']);
	// init page has no state data available
	// ===> reload browser to update the page
	} else {
		document.location.reload();
	}
*/
});




/*--------------------------+
| DATA-TOGGLE : INPUT-VALUE |
+---------------------------+

[Usage]
I put value of trigger element to target element (useful when synchronize value of bootstrap dropdown and hidden field)
===> data-target = ~selector~  (allow multiple)
===> data-toggle = {input-value}
===> data-toggle-attr = ~list of attributes~  (update list of elements presented by [data-target])
===> data-toggle-callback = ~function|function-name~

[Example]
<!-- single -->
<select data-toggle="input-value" data-target="#element"> ... </select>
<!-- multiple -->
<select data-toggle="input-value" data-target="#element-1,#element-2,#element-3" data-toggle-attr="value,data-attr-a,data-attr-b"> ... </select>
*/

$(document)
	// change : listbox
	.on('change', 'select[data-toggle=input-value]', function(evt){
		evt.preventDefault();
		var src = $(this).closest('select');
		$(document).trigger('inputValue.bsx', src);
	})
	// click : non-listbox
	.on('click', '[data-toggle=input-value]:not(select)', function(evt){
		evt.preventDefault();
		var src = this;
		$(document).trigger('inputValue.bsx', src);
	})
	// update target value
	.on('inputValue.bsx', function(evt, triggerElement){
		var targetElement = $(triggerElement).attr('data-target');
		// validation
		if ( !targetElement ) {
			console.log('[Error] '+evt.type+'.'+evt.namespace+' - attribute [data-target] was not specified');
		} else if ( !$(targetElement).length ) {
			console.log('[Error] '+evt.type+'.'+evt.namespace+' - target not found ('+targetElement+')');
		} else if ( !$(targetElement).is('input,select,textarea') ) {
			console.log('[Error] '+evt.type+'.'+evt.namespace+' - target is not a valid input field');
		// update value of target : multiple source value
		// ===> when [data-toggle-attr] is list
		} else if ( $(triggerElement).is('[data-toggle-attr]') && $(triggerElement).attr('data-toggle-attr').split(',').length ) {
			var attrList = $(triggerElement).attr('data-toggle-attr').split(',');
			$(targetElement).each(function(i){
				if ( i < attrList.length ) {
					var attrName = $.trim( attrList[i] );
					var newValue = $(triggerElement).is('select') ? $(triggerElement).find(':selected').attr(attrName) : $(triggerElement).attr(attrName);
					$(this).val( newValue );
				}
			});
		// update value of target : single source value
		// ===> get attribute value if [data-toggle-attr] is defined
		// ===> otherwise, simply get value (or text)
		} else if ( $(triggerElement).is('[data-toggle-attr]') ) {
			var attrName = $(triggerElement).attr('data-toggle-attr');
			var newValue = $(triggerElement).is('select') ? $(triggerElement).find(':selected').attr(attrName) : $(triggerElement).attr(attrName);
			$(targetElement).val( newValue );
		} else {
			var newValue = $(triggerElement).is('input,select,textarea') ? $(triggerElement).val() : $.trim($(triggerElement).html());
			$(targetElement).val( newValue );
		}
		// callback (if any)
		// ===> callback can be either function or event name
		// ===> trigger custom event so that {this} scope is available in callback function
		var toggleCallback = $(triggerElement).is('[data-toggle-callback]') ? $(triggerElement).attr('data-toggle-callback') : '';
		if ( toggleCallback.length ) {
			eval('var toggleCallbackFunc = '+toggleCallback+';');
			// when callback event was fired
			// ===> run the callback function
			$(triggerElement).on('inputValueCallback.bsx', toggleCallbackFunc(evt));
			$(document).on('inputValueCallback.bsx', function(evt){
				triggerElement.callback = toggleCallbackFunc;
				triggerElement.callback(evt);
			});
			// trigger callback event now!
			$(document).trigger('inputValueCallback.bsx').off('inputValueCallback.bsx');
		}
	});


}); // on-document-ready




/*!
 * jQuery blockUI plugin
 * Version 2.70.0-2014.11.23
 * Requires jQuery v1.7 or later
 *
 * Examples at: http://malsup.com/jquery/block/
 * Copyright (c) 2007-2013 M. Alsup
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to Amir-Hossein Sobhi for some excellent contributions!
 */
!function(){"use strict";function e(e){e.fn._fadeIn=e.fn.fadeIn;var o=e.noop||function(){},t=/MSIE/.test(navigator.userAgent),i=/MSIE 6.0/.test(navigator.userAgent)&&!/MSIE 8.0/.test(navigator.userAgent),n=(document.documentMode,e.isFunction(document.createElement("div").style.setExpression));e.blockUI=function(e){a(window,e)},e.unblockUI=function(e){d(window,e)},e.growlUI=function(o,t,i,n){var s=e('<div class="growlUI"></div>');o&&s.append("<h1>"+o+"</h1>"),t&&s.append("<h2>"+t+"</h2>"),void 0===i&&(i=3e3);var l=function(o){o=o||{},e.blockUI({message:s,fadeIn:void 0!==o.fadeIn?o.fadeIn:700,fadeOut:void 0!==o.fadeOut?o.fadeOut:1e3,timeout:void 0!==o.timeout?o.timeout:i,centerY:!1,showOverlay:!1,onUnblock:n,css:e.blockUI.defaults.growlCSS})};l();s.css("opacity");s.mouseover(function(){l({fadeIn:0,timeout:3e4});var o=e(".blockMsg");o.stop(),o.fadeTo(300,1)}).mouseout(function(){e(".blockMsg").fadeOut(1e3)})},e.fn.block=function(o){if(this[0]===window)return e.blockUI(o),this;var t=e.extend({},e.blockUI.defaults,o||{});return this.each(function(){var o=e(this);t.ignoreIfBlocked&&o.data("blockUI.isBlocked")||o.unblock({fadeOut:0})}),this.each(function(){"static"==e.css(this,"position")&&(this.style.position="relative",e(this).data("blockUI.static",!0)),this.style.zoom=1,a(this,o)})},e.fn.unblock=function(o){return this[0]===window?(e.unblockUI(o),this):this.each(function(){d(this,o)})},e.blockUI.version=2.7,e.blockUI.defaults={message:"<h1>Please wait...</h1>",title:null,draggable:!0,theme:!1,css:{padding:0,margin:0,width:"30%",top:"40%",left:"35%",textAlign:"center",color:"#000",border:"3px solid #aaa",backgroundColor:"#fff",cursor:"wait"},themedCSS:{width:"30%",top:"40%",left:"35%"},overlayCSS:{backgroundColor:"#000",opacity:.6,cursor:"wait"},cursorReset:"default",growlCSS:{width:"350px",top:"10px",left:"",right:"10px",border:"none",padding:"5px",opacity:.6,cursor:"default",color:"#fff",backgroundColor:"#000","-webkit-border-radius":"10px","-moz-border-radius":"10px","border-radius":"10px"},iframeSrc:/^https/i.test(window.location.href||"")?"javascript:false":"about:blank",forceIframe:!1,baseZ:1e3,centerX:!0,centerY:!0,allowBodyStretch:!0,bindEvents:!0,constrainTabKey:!0,fadeIn:200,fadeOut:400,timeout:0,showOverlay:!0,focusInput:!0,focusableElements:":input:enabled:visible",onBlock:null,onUnblock:null,onOverlayClick:null,quirksmodeOffsetHack:4,blockMsgClass:"blockMsg",ignoreIfBlocked:!1};var s=null,l=[];function a(a,c){var u,p,h=a==window,k=c&&void 0!==c.message?c.message:void 0;if(!(c=e.extend({},e.blockUI.defaults,c||{})).ignoreIfBlocked||!e(a).data("blockUI.isBlocked")){if(c.overlayCSS=e.extend({},e.blockUI.defaults.overlayCSS,c.overlayCSS||{}),u=e.extend({},e.blockUI.defaults.css,c.css||{}),c.onOverlayClick&&(c.overlayCSS.cursor="pointer"),p=e.extend({},e.blockUI.defaults.themedCSS,c.themedCSS||{}),k=void 0===k?c.message:k,h&&s&&d(window,{fadeOut:0}),k&&"string"!=typeof k&&(k.parentNode||k.jquery)){var y=k.jquery?k[0]:k,v={};e(a).data("blockUI.history",v),v.el=y,v.parent=y.parentNode,v.display=y.style.display,v.position=y.style.position,v.parent&&v.parent.removeChild(y)}e(a).data("blockUI.onUnblock",c.onUnblock);var m,g,I,w,U=c.baseZ;m=t||c.forceIframe?e('<iframe class="blockUI" style="z-index:'+U+++';display:none;border:none;margin:0;padding:0;position:absolute;width:100%;height:100%;top:0;left:0" src="'+c.iframeSrc+'"></iframe>'):e('<div class="blockUI" style="display:none"></div>'),g=c.theme?e('<div class="blockUI blockOverlay ui-widget-overlay" style="z-index:'+U+++';display:none"></div>'):e('<div class="blockUI blockOverlay" style="z-index:'+U+++';display:none;border:none;margin:0;padding:0;width:100%;height:100%;top:0;left:0"></div>'),c.theme&&h?(w='<div class="blockUI '+c.blockMsgClass+' blockPage ui-dialog ui-widget ui-corner-all" style="z-index:'+(U+10)+';display:none;position:fixed">',c.title&&(w+='<div class="ui-widget-header ui-dialog-titlebar ui-corner-all blockTitle">'+(c.title||"&nbsp;")+"</div>"),w+='<div class="ui-widget-content ui-dialog-content"></div>',w+="</div>"):c.theme?(w='<div class="blockUI '+c.blockMsgClass+' blockElement ui-dialog ui-widget ui-corner-all" style="z-index:'+(U+10)+';display:none;position:absolute">',c.title&&(w+='<div class="ui-widget-header ui-dialog-titlebar ui-corner-all blockTitle">'+(c.title||"&nbsp;")+"</div>"),w+='<div class="ui-widget-content ui-dialog-content"></div>',w+="</div>"):w=h?'<div class="blockUI '+c.blockMsgClass+' blockPage" style="z-index:'+(U+10)+';display:none;position:fixed"></div>':'<div class="blockUI '+c.blockMsgClass+' blockElement" style="z-index:'+(U+10)+';display:none;position:absolute"></div>',I=e(w),k&&(c.theme?(I.css(p),I.addClass("ui-widget-content")):I.css(u)),c.theme||g.css(c.overlayCSS),g.css("position",h?"fixed":"absolute"),(t||c.forceIframe)&&m.css("opacity",0);var x=[m,g,I],C=e(h?"body":a);e.each(x,function(){this.appendTo(C)}),c.theme&&c.draggable&&e.fn.draggable&&I.draggable({handle:".ui-dialog-titlebar",cancel:"li"});var S=n&&(!e.support.boxModel||e("object,embed",h?null:a).length>0);if(i||S){if(h&&c.allowBodyStretch&&e.support.boxModel&&e("html,body").css("height","100%"),(i||!e.support.boxModel)&&!h)var O=b(a,"borderTopWidth"),E=b(a,"borderLeftWidth"),T=O?"(0 - "+O+")":0,M=E?"(0 - "+E+")":0;e.each(x,function(e,o){var t=o[0].style;if(t.position="absolute",e<2)h?t.setExpression("height","Math.max(document.body.scrollHeight, document.body.offsetHeight) - (jQuery.support.boxModel?0:"+c.quirksmodeOffsetHack+') + "px"'):t.setExpression("height",'this.parentNode.offsetHeight + "px"'),h?t.setExpression("width",'jQuery.support.boxModel && document.documentElement.clientWidth || document.body.clientWidth + "px"'):t.setExpression("width",'this.parentNode.offsetWidth + "px"'),M&&t.setExpression("left",M),T&&t.setExpression("top",T);else if(c.centerY)h&&t.setExpression("top",'(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"'),t.marginTop=0;else if(!c.centerY&&h){var i="((document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "+(c.css&&c.css.top?parseInt(c.css.top,10):0)+') + "px"';t.setExpression("top",i)}})}if(k&&(c.theme?I.find(".ui-widget-content").append(k):I.append(k),(k.jquery||k.nodeType)&&e(k).show()),(t||c.forceIframe)&&c.showOverlay&&m.show(),c.fadeIn){var B=c.onBlock?c.onBlock:o,j=c.showOverlay&&!k?B:o,H=k?B:o;c.showOverlay&&g._fadeIn(c.fadeIn,j),k&&I._fadeIn(c.fadeIn,H)}else c.showOverlay&&g.show(),k&&I.show(),c.onBlock&&c.onBlock.bind(I)();if(r(1,a,c),h?(s=I[0],l=e(c.focusableElements,s),c.focusInput&&setTimeout(f,20)):function(e,o,t){var i=e.parentNode,n=e.style,s=(i.offsetWidth-e.offsetWidth)/2-b(i,"borderLeftWidth"),l=(i.offsetHeight-e.offsetHeight)/2-b(i,"borderTopWidth");o&&(n.left=s>0?s+"px":"0");t&&(n.top=l>0?l+"px":"0")}(I[0],c.centerX,c.centerY),c.timeout){var z=setTimeout(function(){h?e.unblockUI(c):e(a).unblock(c)},c.timeout);e(a).data("blockUI.timeout",z)}}}function d(o,t){var i,n,a=o==window,d=e(o),u=d.data("blockUI.history"),f=d.data("blockUI.timeout");f&&(clearTimeout(f),d.removeData("blockUI.timeout")),t=e.extend({},e.blockUI.defaults,t||{}),r(0,o,t),null===t.onUnblock&&(t.onUnblock=d.data("blockUI.onUnblock"),d.removeData("blockUI.onUnblock")),n=a?e("body").children().filter(".blockUI").add("body > .blockUI"):d.find(">.blockUI"),t.cursorReset&&(n.length>1&&(n[1].style.cursor=t.cursorReset),n.length>2&&(n[2].style.cursor=t.cursorReset)),a&&(s=l=null),t.fadeOut?(i=n.length,n.stop().fadeOut(t.fadeOut,function(){0==--i&&c(n,u,t,o)})):c(n,u,t,o)}function c(o,t,i,n){var s=e(n);if(!s.data("blockUI.isBlocked")){o.each(function(e,o){this.parentNode&&this.parentNode.removeChild(this)}),t&&t.el&&(t.el.style.display=t.display,t.el.style.position=t.position,t.el.style.cursor="default",t.parent&&t.parent.appendChild(t.el),s.removeData("blockUI.history")),s.data("blockUI.static")&&s.css("position","static"),"function"==typeof i.onUnblock&&i.onUnblock(n,i);var l=e(document.body),a=l.width(),d=l[0].style.width;l.width(a-1).width(a),l[0].style.width=d}}function r(o,t,i){var n=t==window,l=e(t);if((o||(!n||s)&&(n||l.data("blockUI.isBlocked")))&&(l.data("blockUI.isBlocked",o),n&&i.bindEvents&&(!o||i.showOverlay))){var a="mousedown mouseup keydown keypress keyup touchstart touchend touchmove";o?e(document).bind(a,i,u):e(document).unbind(a,u)}}function u(o){if("keydown"===o.type&&o.keyCode&&9==o.keyCode&&s&&o.data.constrainTabKey){var t=l,i=!o.shiftKey&&o.target===t[t.length-1],n=o.shiftKey&&o.target===t[0];if(i||n)return setTimeout(function(){f(n)},10),!1}var a=o.data,d=e(o.target);return d.hasClass("blockOverlay")&&a.onOverlayClick&&a.onOverlayClick(o),d.parents("div."+a.blockMsgClass).length>0||0===d.parents().children().filter("div.blockUI").length}function f(e){if(l){var o=l[!0===e?l.length-1:0];o&&o.focus()}}function b(o,t){return parseInt(e.css(o,t),10)||0}}"function"==typeof define&&define.amd&&define.amd.jQuery?define(["jquery"],e):e(jQuery)}();