(ns gswd3.client.bus_perf
  (:require [gswd3.client.util :as uti]))

(def d3 js/d3)

(defn ^:export draw [jd]
  (let [margin 50
        width 700
        height 300
        x_extent (uti/d3-extent jd "collision_with_injury")
        y_extent (uti/d3-extent jd "dist_between_fail")
        x_scale (uti/d3-linear-scale x_extent margin (- width margin))
        y_scale (uti/d3-linear-scale y_extent (- height margin) margin)
        x_axis (.. (.axis (.-svg js/d3)) (scale x_scale))
        y_axis (.. (.axis (.-svg js/d3)) (scale y_scale) (orient "left"))]
    (.. d3 (select "body")
        (append "svg")
        (attr "width" width)
        (attr "height" height)
        (selectAll "circle")
        (data jd)
        (enter)
        (append "circle")
        (attr "cx" (fn [d] (x_scale (.-collision_with_injury d))))
        (attr "cy" (fn [d] (y_scale (.-dist_between_fail d))))
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
