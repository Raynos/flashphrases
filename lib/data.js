function resolveData(data) {
    if (Array.isArray(data)) {
        return data.map(resolveData);
    } else if (typeof data === 'object') {
        if (data === null) return data;
        if (data.getData && !data._resolving) {
            data._resolving = true;
            try {
                return data.getData();
            } finally {
                delete data._resolving;
            }
        }
        var r = {};
        for (var prop in data) {
            if (data.hasOwnProperty(prop) && prop[0] !== '_') {
                r[prop] = resolveData(data[prop]);
            }
        }
        return r;
    } else {
        return data;
    }
}

module.exports.resolveData = resolveData;
