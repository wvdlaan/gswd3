(ns gswd3.server.main
  (:require [compojure.core :as cmp]
            [compojure.route :as rte]
            [compojure.handler :as hnl]
            [compojure.response :as response]
            [hiccup.page :as hic]
            [hiccup.element :as elm]
            [hiccup.middleware :as mdl]
            [ring.middleware.stacktrace :as rst]))

;; middleware

(defn- log [msg & vals]
  (let [line (apply format msg vals)]
    (locking System/out (println line))))

(defn wrap-request-logging [handler]
  (fn [{:keys [request-method uri] :as req}]
    (let [start  (System/currentTimeMillis)
          resp   (handler req)
          finish (System/currentTimeMillis)
          total  (- finish start)]
      (log "request %s %s (%dms)" request-method uri total)
      resp)))

(defn wrap-bounce-favicon [handler]
  (fn [req]
    (if (= [:get "/favicon.ico"] [(:request-method req) (:uri req)])
      {:status 404
       :headers {}
       :body ""}
      (handler req))))

;; views

(defn draw [script & more]
  (let [d (str "'data/" script ".json'")
        f (str "gswd3.client." script ".draw")
        style (first more)
        content (rest more)]
    (hic/html5
     [:head
      (hic/include-js "d3.js")
      (hic/include-js "main.js")
      (hic/include-css (str script ".css"))
      (when style
        (hic/include-css style))]
     [:body
      content
      [:script (str "d3.json(" d ", " f ");")]])))

(defn link [script]
  [:li [:a {:href script} script]])

(defn index-page []
  (hic/html5
   [:head
    [:title "Getting Started with D3"]]
   [:body
    [:h2 "Getting Started with D3"]
    [:ul
     (link "service_status")
     (link "plaza_traffic")
     (link "bus_perf")
     (link "turnstile_traffic")
     (link "subway_wait_mean")
     (link "stations_graph")
     (link "interarrival_times")]]))

;; routes

(cmp/defroutes main-routes
  (cmp/GET "/" [] (index-page))
  (cmp/GET "/service_status" [] (draw "service_status"))
  (cmp/GET "/plaza_traffic" [] (draw "plaza_traffic"))
  (cmp/GET "/bus_perf" [] (draw "bus_perf"))
  (cmp/GET "/turnstile_traffic" [] (draw "turnstile_traffic"))
  (cmp/GET "/subway_wait_mean" []
           (draw "subway_wait_mean"
                 "train_colours.css"
                 [:div#timeseries]
                 [:div#key]))
  (cmp/GET "/stations_graph" [] (draw "stations_graph"))
  (cmp/GET "/interarrival_times" [] (draw "interarrival_times"))
  (rte/resources "/")
  (rte/not-found "Page not found!"))

;; server

(def server
  (-> (hnl/site main-routes)
      (wrap-request-logging)
      (wrap-bounce-favicon)
      (rst/wrap-stacktrace)
      (mdl/wrap-base-url)))
