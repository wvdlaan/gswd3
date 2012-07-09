(ns gswd3.client.util)

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

;; d3 helpers

(defn d3-extent [d s]
  (. d3 (extent d (fn [d] (aget d s)))))

(defn d3-scale-linear [r d]
  (.. (.linear (.-scale js/d3))
      (range r)
      (domain d)))

(defn d3-time-scale [r d]
  (.. (.scale (.-time js/d3))
      (range r)
      (domain d)))

(defn d3-svg-line [fx fy s]
  (.. (.line (.-svg d3))
      (x fx)
      (y fy)
      (interpolate s)))

(defn d3-layout-force []
  (.force (.-layout d3)))

(defn d3-layout-stack []
  (.stack (.-layout d3)))

(defn d3-layout-histogram []
  (.histogram (.-layout d3)))
