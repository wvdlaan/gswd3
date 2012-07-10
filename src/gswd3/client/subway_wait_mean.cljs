(ns gswd3.client.subway_wait_mean)

;; sample from subway_wait_mean.json
;; {
;;   "line_id": "6_Line"
;;   "line_name": "6 Line",
;;   "mean": 73.400000000000006
;; }

;; sample from subway_wait.json
;; {
;;   "line_id": 1_Line
;;   "line_name": "1 Line",
;;   "late_percent": 73.1,
;;   "month": 1
;; }

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
  (.. (d3.time.scale)
      (range (array 0 (:width chart_dimensions)))
      (domain (array (new js/Date 2008 11 1) (new js/Date 2011 4 1)))))

(def percent_scale
  (.. (d3.scale.linear)
      (range (array (:height chart_dimensions) 0))
      (domain (array 65 90))))

(def time_axis
  (.. (d3.svg.axis) (scale time_scale)))

(def count_axis
  (.. (d3.svg.axis) (scale percent_scale) (orient "left")))

(defn add_label [circle d]
  (.. d3 (select circle)
      (transition)
      (attr "r" 9))
  (.. d3 (select (str "#" d.line_id))
      (append "text")
      (text (aget (. d.line_id (split "_")) 1))
      (attr "text-anchor" "middle")
      (style "dominant-baseline" "central")
      (attr "x" (time_scale d.time))
      (attr "y" (percent_scale d.late_percent))
      (attr "class" "linelabel")
      (style "opacity" 0)
      (style "fill" "white")
      (transition)
      (style "opacity" 1)))

(defn draw_timeseries [jd id]
  (let [line (.. (d3.svg.line)
                 (x (fn [d] (time_scale d.time)))
                 (y (fn [d] (percent_scale d.late_percent)))
                 (interpolate "linear"))
        g (.. d3 (select "#chart")
              (append "g")
              (attr "id" id)
              (attr "class" (str "timeseries " id)))
        enter_duration 1000]
    (.. g (append "path")
        (attr "d" (line jd)))
    (.. g (selectAll "circle")
        (data jd)
        (enter)
        (append "circle")
        (attr "cx" (fn [d] (time_scale d.time)))
        (attr "cy" (fn [d] (percent_scale d.late_percent)))
        (attr "r" 0))
    (.. g (selectAll "circle")
        (transition)
        (delay (fn [d i] (* (/ i jd.length) enter_duration)))
        (attr "r" 5)
        (each "end" (fn [d i]
                      (this-as elem
                               (when (= i (dec jd.length))
                                 (add_label elem d))))))
    (.. g (selectAll "circle")
        (on "mouseover"
            (fn [d]
              (this-as elem
                       (.. d3 (select elem)
                           (transition)
                           (attr "r" 9)))))
        (on "mouseout"
            (fn [d i]
              (this-as elem
                       (when (not= i (dec jd.length))
                         (.. d3 (select elem)
                             (transition)
                             (attr "r" 5)))))))
    (.. g (selectAll "circle")
        (on "mouseover.tooltip"
            (fn [d]
              (.. d3 (select (str "text." d.line_id))
                  (remove))
              (.. d3 (select "#chart")
                  (append "text")
                  (text (str d.late_percent "%"))
                  (attr "x" (+ (time_scale d.time) 10))
                  (attr "y" (- (percent_scale d.late_percent) 10))
                  (attr "class" (str d.line_id)))))
        (on "mouseout.tooltip"
            (fn [d]
              (.. d3 (select (str "text." d.line_id))
                  (transition)
                  (duration 500)
                  (style "opacity" 0)
                  (attr "transform" "translate(10, -10)")
                  (remove)))))))

(defn get_timeseries_data [d i]
  (let [id d.line_id
        ts (. d3 (select (str "#" id)))]
    (if (.empty ts)
      (. d3 (json "data/subway_wait.json"
                  (fn [data]
                    (let [filtered_data
                          (. data (filter (fn [d] (= d.line_id id))))]
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
                      (attr "id" (fn [d] (str d.line_id "_key"))))]
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
        (attr "id" (fn [d] (str "key_square_" d.line_id)))
        (attr "class" (fn [d] (str "key_square " d.line_id))))
    (.. key_items (append "div")
        (attr "class" "key_label")
        (text (fn [d] (str d.line_name))))
    (.. d3 (selectAll ".key_line")
        (on "click" get_timeseries_data))))
