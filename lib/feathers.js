/* global define, exports, module, window */
(function (can, undefined) {
  /**
   * AMD module shim
   * @param {Function} fn The callback function
   */
  var def = (typeof define === "undefined") ? function (deps, fn) {
    var res = fn(can.Model);
    if (typeof exports === "undefined" && typeof window !== "undefined") {
      can.Feathers = res;
    } else {
      module.exports = res;
    }
  } : define;

  def(['can/model'], function (Model) {
    console.log(Model);
    return {};
  });
})(window.can);
