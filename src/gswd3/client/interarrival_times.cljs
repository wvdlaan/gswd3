(ns gswd3.client.interarrival_times)

(def d3 js/d3)

(def width 800)
(def height 300)
(def margin 50)
(def bar_width 2.2)
(def bar_max 23)

(defn ^:export draw [jd]
  (let [stack (d3.layout.stack)
        histogram (.. (d3.layout.histogram)
                      (bins (. d3 (range 1.5 bar_max bar_width)))
                      (frequency false))
        lines (. jd (map (fn [d] (str "Line_" d.route_id))))
        counts (. jd (map (fn [d] (histogram d.interarrival_times))))
        nested_stat (fn [d stat accessor]
                      (stat counts (fn [d] (stat (. d (map accessor))))))
        max_count 2]))

