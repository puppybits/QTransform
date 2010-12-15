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
    $.support.matrixFilter = (divStyle.filter === '' && $.cssProps.transform === false) ?
 		true : false;
    div = null;

    //stop if no form of transforms are supported
    if($.support.transform === false)
        return;

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
	var xy = [['X','Y'],'X','Y'];
	var abcdxy = [['A','B','C','D','X','Y'],'A','B','C','D','X','Y']
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
			subProps: xy,
			fnc: parseFloat,
			_default:1},
		{prop: 'skew',
			matrix: [[1,rtn,rtn,1],
				[1,rtn,0,1],
				[1,0,rtn,1]],
			unit: 'rad',
			subProps: xy,
			fnc: toRadian},
		{prop: 'translate',
			matrix: [[1,0,0,1,rtn,rtn],
				[1,0,0,1,rtn,0],
				[1,0,0,1,0,rtn]],
			subProps: xy,
			fnc: parseFloat},
		{prop: 'matrix',
			matrix: [[rtn,rtn,rtn,rtn,rtn,rtn],
				[rtn,0,0,1,0,0],
				[1,rtn,0,1,0,0],
				[1,0,rtn,1,0,0],
				[1,0,0,rtn,0,0],
				[1,0,0,1,0,rtn]],
			subProps: abcdxy,
			fnc: parseFloat}
		];
		
        jQuery.each(props, function(n,prop){
        jQuery.each(prop.subProps, function(num, sub){
            var _cssProp, _prop = prop;

            if( $.isArray(sub) ) {
                //composite transform
                _cssProp = _prop.prop;
                var _sub = sub;
                $.cssHooks[_cssProp] = {
                    set: function( elem, val ) {
                        jQuery.each(_sub, function(num, x){
                            $.cssHooks[_cssProp+x].set(elem, val);
                        });
                    },
                    get: function( elem, computed ) {
                        var val = [];
                        jQuery.each(_sub, function(num, x){
                            val.push( $.cssHooks[_cssProp+x].get(elem, val) );
                        });
                        //hack until jQuery supports animating multiple properties
                        return val[0] || val[1];
                    }
                }
            } else {
                //independent transfrom
                _cssProp = _prop.prop+sub;
                $.cssHooks[_cssProp] = {
                    set: function( elem, val ) {
                        $.data( elem, _cssProp, _prop.fnc(val));

                        setCSSTransform( elem, val, _cssProp, _prop.unit);
                    },
                    get: function( elem, computed ) {
                        var p = $.data( elem, _cssProp );
                        return p ? p : _prop._default || 0;
                    }
                };
            }

            $.fx.step[_cssProp] = function( fx ) {
                $.cssHooks[_cssProp].set( fx.elem, fx.now+($.cssNumber[_cssProp] ? '' : fx.unit) );
            };
        })
    });

    function setCSSTransform( elem, val, prop, unit ){
        if(typeof val === 'number') {
            val = [val];
        }

        if($.support.matrixFilter) {
            return setIEMatrix(elem, val);
        }
        
        //parse css string
        var allProps = parseCSSTransform(elem);
        
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
                        result += a === 'X' || a === '' ? val[0]+unit : 
                            (arr[0] !== '' ? arr[0] : $.cssHooks[prop+'X'].get(elem)+unit);
                        result += a === 'Y' ? ', '+val[0]+unit : 
                            (arr[1] !== '' ? ', '+arr[1] : 
                            (prop+'Y' in $.cssHooks ? 
                                ', '+$.cssHooks[prop+'Y'].get(elem)+unit : ''));
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

    
    function parseCSSTransform( elem ) {
        var props, prop, name, transform;
		//break up into single transform calls
        $(elem.style[$.cssProps.transform].replace(/(?:\,\s|\)|\()/g,"|").split(" "))
		//read each data point for the transform call
        .each(function(i, item){
            if(item !== '') {
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

    //IE Matrix Handling

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

    //special case for IE matrix
    function setIEMatrix( elem, mat ) {
        var inverse, current, ang, org, originX, originY,
        runTransform = $.cssProps.transformOrigin === 'matrixFilter' ? true : false;

        current = [$.cssHooks.scaleX.get(elem),
                    $.cssHooks.skewY.get(elem),
                    $.cssHooks.skewX.get(elem),
                    $.cssHooks.scaleY.get(elem),
                    $.cssHooks.translateX.get(elem),
                    $.cssHooks.translateY.get(elem)];

        //start by multiply inverse of transform origin by matrix
        if(runTransform) {
            originX = $.cssHooks.transformOriginX.get(elem);
            originY = $.cssHooks.transformOriginY.get(elem);
            originX = originX.indexOf('%') > 1 ? 
                (/[\d]*/.exec(originX) / 100) * elem.offsetWidth : originX;
            originY = originY.indexOf('%') > 1 ? 
                (/[\d]*/.exec(originY) / 100) * elem.offsetWidth : originY;
            inverse = [ 1, 0, 0, 1, -originX, -originY];
            org = [ 1, 0, 0, 1, originX, originY];

            current = [ ( (inverse[0]*current[0]) + (inverse[1]*current[2]) ),
                        ( (inverse[0]*current[1]) + (inverse[1]*current[3]) ),
                        ( (inverse[2]*current[0]) + (inverse[3]*current[2]) ),
                        ( (inverse[2]*current[1]) + (inverse[3]*current[3]) ),
                        ( (inverse[4]*current[0]) + (inverse[5]*current[2]) + current[4]),
                        ( (inverse[4]*current[1]) + (inverse[5]*current[3]) + current[5] )
                        ];  

        } 

        //multiply old matrix to new matrix
        if( typeof mat !== 'array' || mat.length !== 6 ) {
            mat = current;
        } else {
            mat = [ ( (current[0]*mat[0]) + (current[1]*mat[2]) ),
                    ( (current[0]*mat[1]) + (current[1]*mat[3]) ),
                    ( (current[2]*mat[0]) + (current[3]*mat[2]) ),
                    ( (current[2]*mat[1]) + (current[3]*mat[3]) ),
                    ( (current[4]*mat[0]) + (current[5]*mat[2]) + mat[4]),
                    ( (current[4]*mat[1]) + (current[5]*mat[3]) + mat[5])
                    ];
        }

        //multiply the transform and rotation matrixes
        ang = $.data(elem, 'rotate');
        if(ang) {
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
          
        //multiply the transform origin
        if(runTransform) {
            mat = [ ( (mat[0]*org[0]) + (mat[1]*org[2]) ),
                    ( (mat[0]*org[1]) + (mat[1]*org[3]) ),
                    ( (mat[2]*org[0]) + (mat[3]*org[2]) ),
                    ( (mat[2]*org[1]) + (mat[3]*org[3]) ),
                    ( (mat[4]*org[0]) + (mat[5]*org[2]) + org[4]),
                    ( (mat[4]*org[1]) + (mat[5]*org[3]) + org[5])
                    ];

        }
        
        //apply the matrix as a IE filter
        elem.style.filter = [
            "progid:DXImageTransform.Microsoft.Matrix(",
            "M11="+mat[0]+", ",
            "M12="+mat[1]+", ",
            "M21="+mat[2]+", ",
            "M22="+mat[3]+", ",
            "SizingMethod='auto expand'",
            ")"
            ].join('');
        elem.style.left = mat[4];
        elem.style.top = mat[5];
        elem.style.position = 'absolute';

    }

})(jQuery);