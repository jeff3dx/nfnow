/* exported timeSpanConst */
// To import:  import { timeSpanConst, days, hours, mins, secs } from 'appkit/utils/time';

export var secs = function (n) {
  return 1000 * n;
};

export var mins = function (n) {
  return secs(60) * n;
};

export var hours = function (n) {
  return mins(60) * n;
};

export var days = function(n) {
  return hours(24) * n;
};

export var timeSpanConst = {
  '3w': days(21),
  '2w': days(14),
  '1w': days(7),
  '5d': days(5),
  '3d': days(3),
  '24h': hours(24),
  '12h': hours(12),
  '6h': hours(6),
  '3h': hours(3),
  '1h': hours(1),
  '3m': mins(3)
};
