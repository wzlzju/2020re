(function (global, factory) {
    var ns = 'CoordinateConvert';
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(ns, factory());
    } else if (typeof exports !== 'undefined') {
        // CommonJS
        module.exports = factory();
    } else {
        global[ns] = factory();
    }
})(this, function () {
    var pi = Math.PI,
        a = 6378245.0,
        ee = 0.00669342162296594323,
        x_pi = pi * 3000 / 180;

    function outOfChina(lng, lat) {
        return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
    }

    function transformLat(x, y) {
        var pi = Math.PI,
            ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLng(x, y) {
        var pi = Math.PI,
            ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
        return ret;
    }

    function checkCoordinate(lng, lat) {
        if (arguments.length === 1 && lng instanceof Array) {
            lat = +lng[1];
            lng = +lng[0];
        } else {
            lng = +lng;
            lat = +lat;
        }
        if (isNaN(lng) || isNaN(lat)) {
            throw new Error('Invalid parameters');
        }
        return [lng, lat];
    }

    return {
        /**
         * WGS84坐标转GCJ02坐标
         * @param {number|Array} lng 经度值或经纬度数组
         * @param {number} [lat] 纬度值
         * @returns {Array<number>} 转换后的GCJ02经纬度数组
         */
        wgs2gcj : function(lng, lat) {
            var coord = checkCoordinate(lng, lat),
                gLng, gLat;
            lng = coord[0];
            lat = coord[1];
            if (outOfChina(lng, lat)) {
                gLng = lng;
                gLat = lat;
            } else {
                var dLat = transformLat(lng - 105.0, lat - 35.0),
                    dLng = transformLng(lng - 105.0, lat - 35.0),
                    radLat = lat / 180.0 * pi,
                    magic = Math.sin(radLat);
                magic = 1 - ee * magic * magic;
                var sqrtMagic = Math.sqrt(magic);
                dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
                dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
                gLat = lat + dLat;
                gLng = lng + dLng;
            }
            return [gLng, gLat];
        },

        /**
         * WGS84坐标转GCJ02坐标
         * @param {number|Array} lng 经度值或经纬度数组
         * @param {number} [lat] 纬度值
         * @returns {Array<number>} 转换后的GCJ02经纬度数组
         */
        gcj2wgs : function (lng, lat) {
            if (outOfChina(lng, lat)) {
                return [lng, lat]
            }
            else {
                var dlat = transformLat(lng - 105.0, lat - 35.0);
                var dlng = transformLng(lng - 105.0, lat - 35.0);
                var radlat = lat / 180.0 * pi;
                var magic = Math.sin(radlat);
                magic = 1 - ee * magic * magic;
                var sqrtmagic = Math.sqrt(magic);
                dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi);
                dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * pi);
                mglat = lat + dlat;
                mglng = lng + dlng;
                return [lng * 2 - mglng, lat * 2 - mglat]
            }
        },

        /**
         * GCJ02坐标转百度BD09坐标
         * @param {number|Array} lng 经度值或经纬度数组
         * @param {number} [lat] 纬度值
         * @returns {Array<number>} 转换后的BD09经纬度数组
         */
        gcj2bd : function (lng, lat) {
            var coord = checkCoordinate(lng, lat),
                x = coord[0],
                y = coord[1],
                z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi),
                theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
            return [
                z * Math.cos(theta) + 0.0065,
                z * Math.sin(theta) + 0.006
            ];
        },

        /**
         * 百度DB09坐标转GCJ02坐标
         * @param {number|Array} lng 经度值或经纬度数组
         * @param {number} [lat] 纬度值
         * @returns {Array<number>} 转换后的GCJ02经纬度数组
         */
        bd2gcj : function (lng, lat) {
            var coord = checkCoordinate(lng, lat),
                x = coord[0] - 0.0065,
                y = coord[1] - 0.006,
                z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi),
                theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
            return [
                z * Math.cos(theta),
                z * Math.sin(theta)
            ];
        }
    };
});