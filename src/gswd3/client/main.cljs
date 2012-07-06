(ns gswd3.client.main)

(def d3 js/d3)

;; general

(defn log [& args]
  (let [s (apply str (interpose "', '" args))]
    (.log js/console (str "log: '" s "'"))))

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings. This function’s approximate inverse
   js->clj is provided by ClojureScript core.

   Borrowed and updated from mmcgrana."
  [x]
  (cond
   (string? x) x
   (keyword? x) (name x)
   (map? x) (.-strobj (reduce (fn [m [k v]]
                                (assoc m (clj->js k) (clj->js v))) {} x))
   (coll? x) (apply array (map clj->js x))
   :else x))

;; service_status

(defn ^:export service_status [jd]
  (.. d3 (select "body")
      (append "ul")
      (selectAll "li")
      (data jd)
      (enter)
      (append "li")
      (text (fn [d]
              (str (.-name d) ": " (.-status d)))))
  (.. d3 (selectAll "li")
      (style "font-weight"
             (fn [d]
               (if (= (str (.-status d)) "GOOD SERVICE") "normal" "bold")))))

;; plaza_traffic

(defn ^:export plaza_traffic [jd]
  (.. d3 (select "body")
      (append "div")
      (attr "class" "chart")
      (selectAll "div.bar")
      (data jd.cash)
      (enter)
      (append "div")
      (attr "class" "line"))
  (.. d3 (selectAll "div.line")
      (append "div")
      (attr "class" "label")
      (text (fn [d] (str (.-name d)))))
  (.. d3 (selectAll "div.line")
      (append "div")
      (attr "class" "bar")
      (style "width" (fn [d] (str (/ (.-count d) 100) "px")))
      (text (fn [d] (Math/round (.-count d))))))

;; bus_perf

(defn d3-extent [d s]
  (. d3 (extent d (fn [d] (aget d s)))))

(defn d3-linear-scale [extent r1 r2]
  (.. (.linear (.-scale js/d3))
      (range (array r1 r2))
      (domain extent)))

(defn ^:export bus_perf [jd]
  (let [margin 50
        width 700
        height 300
        x_extent (d3-extent jd "collision_with_injury")
        y_extent (d3-extent jd "dist_between_fail")
        x_scale (d3-linear-scale x_extent margin (- width margin))
        y_scale (d3-linear-scale y_extent (- height margin) margin)
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

