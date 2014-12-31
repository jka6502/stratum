(function() {
	'use strict';


	var PREFIX	= 'stratumUnique' + new Date().getTime() + '.',
		MARKER	= PREFIX + '0',
		LENGTH	= PREFIX.length,

		MID		= 1,
		ID		= 0;


	var getOwnPropertyNames = Object.getOwnPropertyNames;

	Object.getOwnPropertyNames = function(object) {
		var names = getOwnPropertyNames.call(Object, object);
		for(var index = 0, length = names.length; index < length; index++) {
			if (names[index].substring(0, LENGTH) === PREFIX) {
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

	unique.id = function(name) {
		return MARKER + MID++ + (name ? '.' + name : '');
	};

	module.exports = unique;


})();