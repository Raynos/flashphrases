function CachedObject() {
    this._cache = {};
    if (!(this instanceof CachedObject)) {
        this.clearCache = CachedObject.prototype.clearCache;
    }
}

CachedObject.prototype.clearCache = function() {
    delete this._cache;
};

CachedObject.defineProperty = function(obj, prop, func) {
    Object.defineProperty(obj, prop, {get: function() {
        var cache = this._cache ? this._cache : (this._cache = {});
        var cached = cache[prop];
        if (cached !== undefined) return cached;
        cached = func.call(this);
        if (cached !== undefined) cache[prop] = cached;
        return cached;
    }});
};

module.exports = CachedObject;
