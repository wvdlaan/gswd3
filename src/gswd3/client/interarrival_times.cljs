(ns gswd3.client.interarrival_times)

;; sample from interarrival_times.json
;; [
;;   {
;;     "interarrival_times": [
;;       19.0,
;;       20.0,
;;       ...
;;       20.0,
;;       20.0
;;       ],
;;       "route_id": "F"
;;   },
;;   ...
;; ]

(def d3 js/d3)

(def width 800)
(def height 300)
(def margin 50)
(def bar_width 2.2)
(def bar_max 23)
(def max_count 2)

(defn ^:export draw [jd]
  (let [stack (d3.layout.stack)
        histogram (.. (d3.layout.histogram)
                      (bins (. d3 (range 1.5 bar_max bar_width)))
                      (frequency false))
        lines (. jd (map (fn [d] (str "Line_" d.route_id))))
        counts (. jd (map (fn [d] (histogram d.interarrival_times))))
        nested_stat (fn [d stat accessor]
                      (stat counts (fn [d] (stat (. d (map accessor))))))
        count_scale (.. (d3.scale.linear)
                        (domain (array 0 max_count))
                        (range (array (- height margin) margin))
                        (nice))
        x_scale (.. (d3.scale.linear)
                    (domain
                     (array (nested_stat counts d3.min (fn [di] di.x))
                            (nested_stat counts d3.max (fn [di] di.x))))
                    (range (array margin width)))
        xaxis (.. (d3.svg.axis) (scale x_scale))
        yaxis (.. (d3.svg.axis) (scale count_scale) (orient "left"))
        svg (.. d3 (select "body")
                (append "svg")
                (attr "width" width)
                (attr "height" height))]
    (.. svg (selectAll "g")
        (data (stack counts))
        (enter)
        (append "g")
        (attr "class" (fn [d i] (aget lines i)))
        (selectAll "rect")
        (data (fn [d] d))
        (enter)
        (append "rect")
        (attr "x" (fn [d] (x_scale d.x)))
        (attr "y" (fn [d] (- (count_scale d.y)
                             (- height margin (count_scale d.y0)))))
        (attr "width" (fn [d] (- (x_scale (+ d.x d.dx)) (x_scale d.x))))
        (attr "height" (fn [d] (- height margin (count_scale d.y)))))
    (.. svg (append "g")
        (attr "transform" (str "translate(0," (- height margin) ")"))
        (call xaxis))
    (.. svg (append "text")
        (attr "x" (x_scale 10))
        (attr "y" (- height (/ margin 5)))
        (text "scheduled wait time (minutes)"))))
