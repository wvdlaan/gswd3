(ns gswd3.client.bus_perf)

;; sample from bus_perf.json
;; {
;;   "collision_with_injury": 3.2,
;;   "dist_between_fail": 3924.0,
;;   "customer_accident_rate": 2.12
;; }

(def d3 js/d3)

(def margin 50)
(def width 700)
(def height 300)

(defn ^:export draw [jd]
  (let [x_extent (d3.extent jd (fn [d] d.collision_with_injury))
        y_extent (d3.extent jd (fn [d] d.dist_between_fail))
        x_scale (.. (d3.scale.linear)
                    (range (array margin (- width margin)))
                    (domain x_extent))
        y_scale (.. (d3.scale.linear)
                    (range (array (- height margin) margin))
                    (domain y_extent))
        x_axis (.. (d3.svg.axis) (scale x_scale))
        y_axis (.. (d3.svg.axis) (scale y_scale) (orient "left"))]
    (.. d3 (select "body")
        (append "svg")
        (attr "width" width)
        (attr "height" height)
        (selectAll "circle")
        (data jd)
        (enter)
        (append "circle")
        (attr "cx" (fn [d] (x_scale d.collision_with_injury)))
        (attr "cy" (fn [d] (y_scale d.dist_between_fail)))
        (attr "r" 5))
    (.. d3 (select "svg")
        (append "g")
        (attr "class" "x axis")
        (attr "transform" (str "translate(0," (- height margin) ")"))
        (call x_axis))
    (.. d3 (select "svg")
        (append "g")
        (attr "class" "y axis")
        (attr "transform" (str "translate(" margin ", 0 )"))
        (call y_axis))
    (.. d3 (select ".y.axis")
        (append "text")
        (text "mean distance between failure (miles)")
        (attr "transform" "rotate (-90, -43, 0) translate(-280)"))
    (.. d3 (select ".x.axis")
        (append "text")
        (text "collisions with injury (per million miles)")
        (attr "x" (fn [] (- (/ width 2) margin)))
        (attr "y" (/ margin 1.5)))))
