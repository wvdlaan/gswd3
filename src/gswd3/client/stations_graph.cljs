(ns gswd3.client.stations_graph)

;; sample from stations_graph.json; jd.nodes
;; {
;;   "name": "St George"
;; }

;; sample from stations_graph.json; jd.links
;; {
;;   "source": 0,
;;   "target": 264
;; }

(def d3 js/d3)

(def width 1500)
(def height 1500)

(defn ^:export draw [jd]
  (let [svg (.. d3 (select "body")
                (append "svg")
                (attr "width" width)
                (attr "height" height))
        node (.. svg (selectAll "circle.node")
                 (data jd.nodes)
                 (enter)
                 (append "circle")
                 (attr "class" "node")
                 (attr "r" 12))
        link (.. svg (selectAll "line.link")
                 (data jd.links)
                 (enter)
                 (append "line")
                 (style "stroke" "black"))
        force (.. (d3.layout.force)
                  (charge -120)
                  (linkDistance 30)
                  (size (array width height))
                  (nodes jd.nodes)
                  (links jd.links)
                  (start))]
    (. force
        (on "tick"
            (fn []
              (.. link
                  (attr "x1" (fn [d] d.source.x))
                  (attr "y1" (fn [d] d.source.y))
                  (attr "x2" (fn [d] d.target.x))
                  (attr "y2" (fn [d] d.target.y)))
              (.. node
                  (attr "cx" (fn [d] d.x))
                  (attr "cy" (fn [d] d.y))))))
    (. node (call force.drag))))
