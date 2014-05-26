(function() {


	if (!Array.prototype.iterator) {
		Object.defineProperty(Array.prototype, 'iterator', {
			value: function() {

				var array	= this,
					length	= this.length,
					index	= 0;

				function next() {
					next.value	= array[index++];
					next.done	= index > length;
					return next;
				}

				return {next: next};
			},

			enumerable: false
		});
	}


})();