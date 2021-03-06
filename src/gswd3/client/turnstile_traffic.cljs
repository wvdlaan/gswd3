(ns gswd3.client.turnstile_traffic)

;; sample from turnstile_traffic.json
;; {
;;   "count": 87.36111111111111,
;;   "time": 1328371200000
;; }

(def d3 js/d3)

(def margin 50)
(def width (- 700 margin))
(def height (- 300 margin))
        
(defn ^:export draw [jd]
  (let [dboth (. jd.times_square (concat jd.grand_central))
        count_extent (d3.extent dboth (fn [d] d.count))
        time_extent (d3.extent dboth (fn [d] d.time))
        count_scale (.. (d3.scale.linear)
                        (range (array height margin))
                        (domain count_extent))
        time_scale (.. (d3.time.scale)
                       (range (array margin width))
                       (domain time_extent))
        count_axis (.. (d3.svg.axis) (scale count_scale) (orient "left"))
        time_axis (.. (d3.svg.axis) (scale time_scale))
        line (.. (d3.svg.line)
                 (x (fn [d] (time_scale d.time)))
                 (y (fn [d] (count_scale d.count)))
                 (interpolate "linear"))]
    (.. d3 (select "body")
        (append "svg")
        (attr "class" "chart")
        (attr "width" (+ width margin))
        (attr "height" (+ height margin)))
    (.. d3 (select "svg")
        (append "path")
        (attr "d" (line jd.times_square))
        (attr "class" "times_square"))
    (.. d3 (select "svg")
        (append "path")
        (attr "d" (line jd.grand_central))
        (attr "class" "grand_central"))
    (.. d3 (select "svg")
        (selectAll "circle.times_square")
        (data jd.times_square)
        (enter)
        (append "circle")
        (attr "class" "times_square"))
    (.. d3 (select "svg")
        (selectAll "circle.grand_central")
        (data jd.grand_central)
        (enter)
        (append "circle")
        (attr "class" "grand_central"))
    (.. d3 (selectAll "circle")
        (attr "cy" (fn [d] (count_scale d.count)))
        (attr "cx" (fn [d] (time_scale d.time)))
        (attr "r" 3))
    (.. d3 (select "svg")
        (append "g")
        (attr "class" "x axis")
        (attr "transform" (str "translate(0," height ")"))
        (call time_axis))
    (.. d3 (select "svg")
        (append "g")
        (attr "class" "y axis")
        (attr "transform" (str "translate(" margin ",0)"))
        (call count_axis))
    (.. d3 (select ".y.axis")
        (append "text")
        (text "mean number of turnstile revolutions")
        (attr "transform" (str "rotate (90, " (- margin) ", 0)"))
        (attr "x" 20)
        (attr "y" 0))
    (.. d3 (select ".x.axis")
        (append "text")
        (text "time")
        (attr "x" (fn [] (- (/ width 1.6) margin)))
        (attr "y" (/ margin 1.5)))))
