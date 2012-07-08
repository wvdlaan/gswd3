(ns gswd3.client.subway_wait_mean
  (:require [gswd3.client.util :as uti]))

(def d3 js/d3)

(def container_dimensions {:width 900 :height 400})
(def margins {:top 10 :right 20 :bottom 30 :left 60})
(def chart_dimensions {:width (- (:width container_dimensions)
                                 (:left margins)
                                 (:right margins))
                       :height (- (:height container_dimensions)
                                  (:top margins)
                                  (:bottom margins))})

(def time_scale
  (uti/d3-time-scale (array 0 (:width chart_dimensions))
                     (array 1230789600000 1301634000000)))

(def percent_scale
  (uti/d3-scale-linear (array (:height chart_dimensions) 0)
                       (array 65 90)))

(def time_axis
  (.. (.axis (.-svg js/d3)) (scale time_scale)))

(def count_axis
  (.. (.axis (.-svg js/d3)) (scale percent_scale) (orient "left")))

(defn add_label [circle d i]
  (.. d3 (select "circle")
      (transition)
      (attr "r" 9))
  (.. d3 (select (str "#" (.-line_id d)))
      (append "text")
      (text (str (.-line_id d)))
      (attr "text-anchor" "middle")
      (style "dominant-baseline" "central")
      (attr "x" (time_scale (.-time d)))
      (attr "y" (percent_scale (.-late_percent d)))
      (attr "class" "linelabel")
      (style "opacity" 0)
      (style "fill" "white")
      (transition)
      (style "opacity" 1)))

(defn draw_timeseries [jd id]
  (let [line (uti/d3-svg-line
              (fn [d] (time_scale (.-time d)))
              (fn [d] (percent_scale (.-late_percent d)))
              "linear")
        g (.. d3 (select "#chart")
              (append "g")
              (attr "id" id)
              (attr "class" (str "timeseries" id)))
        enter_duration 1000]
    (.. g (append "path")
        (attr "d" (line jd)))
    (.. g (selectAll "circle")
        (data jd)
        (enter)
        (append "circle")
        (attr "cx" (fn [d] (time_scale (.-time d))))
        (attr "cy" (fn [d] (percent_scale (.-late_percent d))))
        (attr "r" 0))
    (.. g (selectAll "circle")
        (transition)
        (delay (fn [d i] (/ i (* (.-length jd) enter_duration))))
        (attr "r" 5)
        (each "end" (fn [d i]
                      (this-as elem
                               (when (= i (dec (.-length jd)))
                                 (add_label elem d i))))))
    (.. g (selectAll "circle")
        (on "mouseover" (fn [d]
                          (this-as elem
                                   (.. d3 (select elem)
                                       (transition)
                                       (attr "r" 9)))))
        (on "mouseout" (fn [d i]
                         (this-as elem
                                  (when (not= i (dec (.-length jd)))
                                    (.. d3 (select elem)
                                        (transition)
                                        (attr "r" 5)))))))))

(defn get_timeseries_data [d i]
  (let [id (.-line_id d)
        ts (. d3 (select (str "#" id)))]
    (if (.empty ts)
      (. d3 (json "data/subway_wait.json"
                  (fn [data]
                    (let [filtered_data (. data (filter (fn [d] (= (.-line_id d) id))))]
                      (draw_timeseries filtered_data id)))))
      (. ts (remove)))))

(defn ^:export draw [jd]
  (let [g (.. d3 (select "#timeseries")
              (append "svg")
              (attr "width" (:width container_dimensions))
              (attr "height" (:height container_dimensions))
              (append "g")
              (attr "transform" (str "translate("
                                     (:left margins)
                                     ","
                                     (:top margins)
                                     ")"))
              (attr "id" "chart"))
        key_items (.. d3 (select "#key")
                      (selectAll "div")
                      (data jd)
                      (enter)
                      (append "div")
                      (attr "class" "key_line")
                      (attr "id" (fn [d] (str (.-line_id d) "_key"))))]
    (.. g (append "g")
        (attr "class" "x axis")
        (attr "transform" (str "translate(0," (:height chart_dimensions) ")"))
        (call time_axis))
    (.. g (append "g")
        (attr "class" "y axis")
        (call count_axis))
    (.. d3 (select ".y.axis")
        (append "text")
        (text "percent on time")
        (attr "transform" "rotate (-270, 0, 0)")
        (attr "x" 100)
        (attr "y" 50))
    (.. key_items (append "div")
        (attr "id" (fn [d] (str "key_square_" (.-line_id d))))
        (attr "class" (fn [d] (str "key_square " (.-line_id d)))))
    (.. key_items (append "div")
        (attr "class" "key_label")
        (text (fn [d] (str (.-line_name d)))))
    (.. d3 (selectAll ".key_line")
        (on "click" get_timeseries_data))))
