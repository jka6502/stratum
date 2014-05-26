(function() {
	"use strict";


	var MARKER	= 'stratumUnique' + new Date().getTime(),
		ID		= 0;


	var getOwnPropertyNames = Object.getOwnPropertyNames;
	Object.getOwnPropertyNames = function(object) {
		var names = getOwnPropertyNames.call(Object, object);
		for(var index = 0, length = names.length; index < length; index++) {
			if (names[index] === MARKER) {
				names.splice(index, 1);
				return names;
			}
		}
		return names;
	}

	function unique(item) {
		if (item === null) {
			return 'null';
		}

		switch(typeof(item)) {
			case 'string': return 's' + item;
			case 'number': return isNaN(item) ? 'NaN' : 'n' + item;
			case 'undefined': return 'u';
			case 'boolean': return 'b' + item;
			default:
				if (!item.hasOwnProperty(MARKER)) {
					Object.defineProperty(item, MARKER, {
						value: 'o' + ID++,
						enumerable: false
					});
				}
				return item[MARKER];
		}
	}


	module.exports = unique;


})();