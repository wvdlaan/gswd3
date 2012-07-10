(ns gswd3.client.util)

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
