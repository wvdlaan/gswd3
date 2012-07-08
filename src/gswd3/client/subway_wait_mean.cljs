(ns gswd3.client.subway_wait_mean
  (:require [gswd3.client.util :as uti]))

(def d3 js/d3)

(defn ^:export draw [jd]
  (let [container_dimensions {:width 900 :height 400}
        margins {:top 10 :right 20 :bottom 30 :left 60}
        chart_dimensions {:width (- (:width container_dimensions)
                                    (:left margins)
                                    (:right margins))
                          :height (- (:height container_dimensions)
                                     (:top margins)
                                     (:bottom margins))}
        time_scale nil
        percent_scale nil
        draw_timeseries (fn [data id]
                          (let [line (uti/d3-svg-line
                                      (fn [d] (time_scale (.-time d)))
                                      (fn [d] (percent_scale (.-late_percent d)))
                                      "linear")]))
        get_timeseries_data (fn [d i]
                              (let [id (.-line_id d)
                                    ts (. d3 (select (str "#" id)))]
                                (if (.empty ts)
                                  (. d3
                                     (json "data/subway_wait.json"
                                           (fn [data]
                                             (let [filtered_data (. data
                                                                    (filter
                                                                     (fn [d]
                                                                       (= (.-line_id d)
                                                                          id))))]
                                               (draw_timeseries filtered_data id)))))
                                  (. ts (remove)))))
        g (.. d3 (select "#timeseries")
              (append "svg")
              (attr "width" (:width container_dimensions))
              (attr "height" (:height container_dimensions))
              (append "g")
              (attr "transform" (str "translate("
                                     (:left margins)
                                     ","
                                     (:top margins)
                                     ")"))
              (attr "id" "chart"))]))
