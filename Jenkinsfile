pipeline {
    agent any

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = env.GIT_BRANCH
                    echo "Branch detectada: ${branch}"

                    if (branch == 'origin/main') {
                        sh '''
                        cd /root/diasekovaltchuk
                        git fetch origin
                        git reset --hard origin/main
                        docker compose --profile prod up -d --build
                        '''
                    }

                    else if (branch == 'origin/dev') {
                        sh '''
                        cd /root/diasekovaltchuk-dev
                        git fetch origin
                        git reset --hard origin/dev
                        docker compose --profile dev up -d --build
                        '''
                    }

                    else {
                        echo "Branch não suportada: ${branch}"
                    }
                }
            }
        }

    }
}
