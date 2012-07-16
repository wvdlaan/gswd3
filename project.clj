(defproject gswd3 "0.1.0-SNAPSHOT"
  :description "Code repository for the book 'Getting Started with D3'"
  :url "github.com/mikedewar/getting_started_with_d3"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.1.0"]
                 [hiccup "1.0.0"]
                 [ring "1.1.0"]]
  :plugins [[lein-ring "0.7.1"]
            [lein-cljsbuild "0.2.1"]]
  :cljsbuild {
              :builds [{:source-path "src/gswd3/client"
                        :compiler {:output-to "resources/public/main.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]}
  :ring {:handler gswd3.server.main/server})
