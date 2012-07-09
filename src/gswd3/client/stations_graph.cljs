(ns gswd3.client.stations_graph
  (:require [gswd3.client.util :as uti]))

(def d3 js/d3)

(def width 1500)
(def height 1500)

(defn ^:export draw [jd]
  (let [svg (.. d3 (select "body")
                (append "svg")
                (attr "width" width)
                (attr "height" height))
        node (.. svg (selectAll "circle.node")
                 (data (.-nodes jd))
                 (enter)
                 (append "circle")
                 (attr "class" "node")
                 (attr "r" 12))
        link (.. svg (selectAll "line.link")
                 (data (.-links jd))
                 (enter)
                 (append "line")
                 (style "stroke" "black"))
        force (.. (uti/d3-layout-force)
                  (charge -120)
                  (linkDistance 30)
                  (size (array width height))
                  (nodes (.-nodes jd))
                  (links (.-links jd))
                  (start))]
    (. force
        (on "tick"
            (fn []
              (.. link
                  (attr "x1" (fn [d] (.-x (.-source d))))
                  (attr "y1" (fn [d] (.-y (.-source d))))
                  (attr "x2" (fn [d] (.-x (.-target d))))
                  (attr "y2" (fn [d] (.-y (.-target d)))))
              (.. node
                  (attr "cx" (fn [d] (.-x d)))
                  (attr "cy" (fn [d] (.-y d)))))))
    (. node (call (.-drag force)))))
