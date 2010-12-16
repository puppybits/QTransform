/*
 * based off of Louis-Rémi Babé rotate plugin (https://github.com/lrbabe/jquery.rotate.js)
 *
 * cssTransforms: jQuery cssHooks adding a cross browser, animatible transforms
 *
 * Author Bobby Schultz
 */
 //
(function($) {
      
    var div = document.createElement('div'),
      divStyle = div.style;
      
    //give props to those who dont have them
    $.cssProps.transform = 
        divStyle.MozTransform === '' ? 'MozTransform' :
        (divStyle.MsTransform === '' ? 'MsTransform' :
        (divStyle.WebkitTransform === '' ? 'WebkitTransform' :
        (divStyle.OTransform === '' ? 'OTransform' :
        (divStyle.Transform === '' ? 'Transform' :
        false))));
    $.cssProps.transformOrigin = 
        divStyle.MozTransformOrigin === '' ? 'MozTransformOrigin' :
        (divStyle.MsTransformOrigin === '' ? 'MsTransformOrigin' :
        (divStyle.WebkitTransformOrigin === '' ? 'WebkitTransformOrigin' :
        (divStyle.OTransformOrigin === '' ? 'OTransformOrigin' :
        (divStyle.TransformOrigin === '' ? 'TransformOrigin' :
        false))));

    //define supported or not
    $.support.transform = $.cssProps.transform !== false || divStyle.filter === '' ? true : false;
    $.support.transformOrigin = $.cssProps.transformOrigin !== false ? true : false;

    //if ONLY IE matrixes are supported (IE9 beta6 will use css3)
    $.support.matrixFilter = divStyle.filter === '' && $.cssProps.transform === false ? true : false;
    div = null;

    //stop if no form of transforms are supported
    if($.support.transform === false)
        return;

    //  fake an origin (IE8)
    if($.support.transformOrigin === false && $.support.matrixFilter === true) {
        $.cssNumber.transformOrigin = 
        $.cssNumber.transformOriginX = 
        $.cssNumber.transformOriginY = true; 
        
        $.cssProps.transformOrigin = 'matrixFilter';
        
        $.cssHooks.transformOrigin = {
            set: function(elem, val) {
                value = value.split(" ");
                $.cssHooks.transformOriginX.set( elem, val[0] );
                $.cssHooks.transformOriginY.set( elem, val[1] || val[0] );
            },
            get: function(elem, value) {
                var originX = $.data( elem, 'transformOriginX' );
                var originY = $.data( elem, 'transformOriginY' );
                return originX && originY && originX === originY ? originX : '50%';
            }
        };
        
        $.cssHooks.transformOriginX = {
            set: function(elem, value) {
                //not supporting em or pt
                if( /(?:px|%)/.exec(value).length > 1 ) return;
                $.data( elem, 'transformOriginX', value );
            },
            get: function(elem, value) {
                var originX = $.data( elem, 'transformOriginX' );
                switch(originX) {
                    case 'left': return '0%';
                    case 'center': return '50%';
                    case 'right': return '100%';
                }
                return originX ? originX : '50%';
            }
        };
        
        $.cssHooks.transformOriginY = {
            set: function(elem, value) {
                //not supporting em or pt
                if( /(?:px|%)/.exec(value).length > 1 ) return;
                $.data( elem, 'transformOriginY', value );
            },
            get: function(elem, value) {
                var originY = $.data( elem, 'transformOriginY' );
                switch(originY) {
                    case 'top': return '0%';
                    case 'center': return '50%';
                    case 'bottom': return '100%';
                }
				return originY ? originY : '50%';
            }
        };
    }
       
    //opt out of letting jquery handle the units for custom setters/getters 
    $.cssNumber.skew = 
    $.cssNumber.skewX = 
    $.cssNumber.skewY = 
    $.cssNumber.scale =
    $.cssNumber.scaleX =
    $.cssNumber.scaleY =
    $.cssNumber.rotate = 
    $.cssNumber.matrix = true;


	//create hooks for css transforms
	var rtn = function(v){return v;};
	var props = [
		{prop: 'rotate', 
			matrix: [function(v){ return Math.cos(v); },
				function(v){ return -Math.sin(v); },
				function(v){ return Math.sin(v); },
				function(v){ return Math.cos(v); } ],
			unit: 'rad',
			subProps: [''],
			fnc: toRadian},
		{prop: 'scale',
			matrix: [[rtn,0,0,rtn],
				[rtn,0,0,1],
				[1,0,0,rtn]],
			unit: '',
			subProps: ['','X','Y'],
			fnc: parseFloat,
			default:1},
		{prop: 'skew',
			matrix: [[1,rtn,rtn,1],
				[1,rtn,0,1],
				[1,0,rtn,1]],
			unit: 'rad',
			subProps: ['','X','Y'],
			fnc: toRadian},
		{prop: 'translate',
			matrix: [[1,0,0,1,rtn,rtn],
				[1,0,0,1,rtn,0],
				[1,0,0,1,0,rtn]],
			subProps: ['','X','Y'],
			fnc: parseFloat}
		];
		
	jQuery.each(props, function(n,prop){
		jQuery.each(prop.subProps, function(num, sub){
			var _cssProp = prop.prop+sub;
			var _prop = prop;
			$.cssHooks[_cssProp] = {
				set: function( elem, val ) {
					if(!val) return;

		            if (typeof val === 'string') {
		                val = val.split(',');
		                jQuery.each(function(i, val) {
		                    val[i] = _prop.fnc(val[i]);
		                });
		            }

		            $.data( elem, _cssProp, val);

		            if (!$.support.matrixFilter) {
			        	$.fn.setCSSTransform( elem, val, _cssProp, _prop.unit);
		            } else {
						var matrix;
						jQuery.each(_props.matrix[num], function(m){
							$.cssHooks.matrix.push( jQuery.isFunction(m) ? m(val) : m );
						});
		                return $.cssHooks.matrix.set( elem, matrix );
		            }
				},
				get: function( elem, computed ) {
		            var p = $.data( elem, _cssProp );
		            return p ? p : _prop.default || 0;
		        }
			};
			
			$.fx.step[_cssProp] = function( fx ) {
		      $.cssHooks[_cssProp].set( fx.elem, fx.now+($.cssNumber[_cssProp] ? '' : fx.unit) );
		    };
		})
		
	})

    $.cssHooks.matrix = {
        set: function( elem, mat ) {
            var inverse, mat, ang, org;
            var runTransform = $.cssHooks.transformOrigin === 'matrixFilter' ? true : false;
            
            
  
            //if matrix not valid get values from each transform property
            if(mat == undefined || (typeof mat === 'array' && mat.length !== 6)) {
                mat = [$.cssHooks.scaleX.get(elem) || $.cssHooks.scale.get(elem),
                        $.cssHooks.skewY.get(elem) || $.cssHooks.skew.get(elem),
                        $.cssHooks.skewX.get(elem) || $.cssHooks.skew.get(elem),
                        $.cssHooks.scaleY.get(elem) || $.cssHooks.scale.get(elem),
                        $.cssHooks.translateX.get(elem) || $.cssHooks.translate.get(elem),
                        $.cssHooks.translateY.get(elem) || $.cssHooks.translate.get(elem)];
            }
            
            //get origin for IE8
            if(runTransform) {
                elem.style.filter = [
                    "progid:DXImageTransform.Microsoft.Matrix(M11=1,M12=0,M21=0,M22=1,SizingMethod='auto expand')"
                ].join('');
                var Wp = $.cssHooks.transformOriginX.get(elem);
                var Hp = $.cssHooks.transformOriginY.get(elem);
                Wp = Wp.indexOf('%') > 1 ? 
                    (/[\d]*/.exec(Wp) / 100) * elem.offsetWidth : Wp;
                Hp = Hp.indexOf('%') > 1 ? 
                    (/[\d]*/.exec(Hp) / 100) * elem.offsetWidth : Hp;
                
                var Wb = elem.offsetWidth;
                var Hb = elem.offsetHeight;
            }
            
            
            //get rotation (in radians)
            ang = $.data(elem, 'rotate');
            if(ang) {
                //calculate the rotation
                var cos = Math.cos(ang);
                var sin = Math.sin(ang);
            
                ang = [cos, -sin, sin, cos];
             
                mat = [ ( (mat[0]*ang[0]) + (mat[1]*ang[2]) ),
                        ( (mat[0]*ang[1]) + (mat[1]*ang[3]) ),
                        ( (mat[2]*ang[0]) + (mat[3]*ang[2]) ),
                        ( (mat[2]*ang[1]) + (mat[3]*ang[3]) ),
                        ( (mat[4]*ang[0]) + (mat[5]*ang[2]) ),
                        ( (mat[4]*ang[1]) + (mat[5]*ang[3]) )
                        ];
            }
            
            mat = [ ( (mat[0]*org[0]) + (mat[1]*org[2]) ),
                    ( (mat[0]*org[1]) + (mat[1]*org[3]) ),
                    ( (mat[2]*org[0]) + (mat[3]*org[2]) ),
                    ( (mat[2]*org[1]) + (mat[3]*org[3]) ),
                    ( (mat[4]*org[0]) + (mat[5]*org[2]) ),
                    ( (mat[4]*org[1]) + (mat[5]*org[3]) )
                    ];
            
            //apply the matrix as a IE filter
            elem.style.filter = [
                "progid:DXImageTransform.Microsoft.Matrix(",
                "M11="+mat[0]+",",
                "M12="+mat[1]+",",
                "M21="+mat[2]+",",
                "M22="+mat[3]+",",
                "SizingMethod='auto expand'",
                ")"
            ].join('');
            
            if (runTransform) {
                var Wo = elem.offsetWidth;
                var Ho = elem.offsetHeight;
                elem.style.position = 'relative';
                elem.style.left = Wp * (Wb - Wo);
                elem.style.top  = Hp * (Hb - Ho);
            } 
        },
        get: function( elem, computed ) {
            //Use indivual transform properies to animate
        }
    }
    
    $.fn.setCSSTransform = function( elem, val, prop, unit ){
        if(typeof val === 'number') {
            val = [val];
        }
        
        //parse css string
        var allProps = $.fn.parseCSSTransform(elem);
        
        //check for value to be set
        var a = /[X|Y]/.exec(prop);
        a = (a === null ? '' : a[0] ? a[0] : a);
        prop = /.*[^XY]/.exec(prop)[0];
        unit = unit === undefined ? '' : unit;
        
        //create return string
        var result = '';
        var wasUpdated = false;
        var arr;
        if(allProps !== null) {
            for(item in allProps) {
                arr = allProps[item];
                if(prop === item) {
                    //update parsed data with new value
                    if(prop !== 'matrix') {
                        result += prop+'(';
                        result += a === 'X' ? val[0]+unit : (a==="" ? val[0]+unit : arr[0]);
                        result += a === 'Y' ? ', '+val[0]+unit : 
                            (a === 'X' && arr[1] !== '' ? ', '+arr[1] : '');
                        result += ') ';
                    } else { 
                        result += val[0]+' ';
                    }
                    wasUpdated = true;
                } else {
                    //dump parsed data to string
                    result += item + '(';
                    for(var i=0; i<arr.length; i++) {
                        result += arr[i];
                        if(i < arr.length-1 && arr[i+1] !== '')
                            result += ', '
                        else 
                            break;
                    }
                    result += ') ';
                } 
            }
        }
            
        //if prop was not found to be updated, then dump data
        if(!wasUpdated)
            result += prop+a+'('+val[0]+unit+ ') ';
        
        //set all transform properties
        elem.style[$.cssProps.transform] = result;
		console.log(elem.style[$.cssProps.transform]);
    }

    
    $.fn.parseCSSTransform = function( elem ) {
        var props;
        var prop;
        var name;
        var transform;
        $(elem.style[$.cssProps.transform].replace(/(?:\,\s|\)|\()/g,"|").split(" "))
        .each(function(i, item){
            if(item != '') {
                if(props === undefined) props = {}
                prop = item.split("|");
                name = prop.shift();
                transform = /.*[^XY]/.exec(name)[0];
                if(!props[transform]) props[transform] = ['','','','','',''];
                if(!/Y/.test(name)) props[transform][0] = prop[0];
                if(!/X/.test(name)) props[transform][1] = prop[1];
                if(prop.length == 6) {
                    props[transform][2] = prop[2];
                    props[transform][3] = prop[3];
                    props[transform][4] = prop[4];
                    props[transform][5] = prop[5];
                }
            }
        });
        
        return props !== undefined ? props : null ;
    }
    
    function ieOrigin(o, n, percent) {
        return percent * (boundingBoxLength - originalLength);
    }

    function toRadian(value) {
      if(value.indexOf("deg") != -1) {
        return parseInt(value,10) * (Math.PI * 2 / 360);
      } else if (value.indexOf("grad") != -1) {
        return parseInt(value,10) * (Math.PI/200);
      }
      return parseFloat(value);
    }

    $.rotate = {
      radToDeg: function radToDeg( rad ) {
	      return rad * 180 / Math.PI;
	    }
    };

  
})(jQuery);