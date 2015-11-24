DROP TABLE IF EXISTS `cassini_ISS_metadata`;

CREATE TABLE `cassini_ISS_metadata` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `full_path` varchar(255) DEFAULT NULL,
  `image_id` varchar(255) DEFAULT NULL,
  `filters` varchar(255) DEFAULT NULL,
  `series_id` varchar(255) DEFAULT NULL,
  `series_number` int(11) DEFAULT NULL,
  `image_time` varchar(255) DEFAULT NULL,
  `target` varchar(255) DEFAULT NULL,
  `adjusted_ts` date DEFAULT NULL,
  `clean_date` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
